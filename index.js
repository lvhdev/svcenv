#!/usr/bin/env node
/* eslint no-console: off */
const aws = require('aws-sdk');
const needle = require('needle');
const path = require('path');
const { ensureDirSync } = require('fs-extra');
const { writeFileSync } = require('fs');
const debug = require('debug')('svcenv');
const CWD = process.cwd();

function setCredentials(profile) {
  const { SharedIniFileCredentials } = aws;
  const credentials = new SharedIniFileCredentials({profile});
  aws.config.credentials = credentials;
  return;
}

function showHelp(exitCode) {
  const message = `
  Usage: svcenv [OPTIONS] ServiceName SecretId [outputDir]
  
  Options:
      -e,  --envFile      Name of envFile to dump in outputDir (default = ./.env)
      -h,  --help         Display help screen
      -p,  --profile      If using local ~/.aws credentials
      -r,  --region       Region to use for secrets lookup
      -v,  --version      Display version
  
  `;
  console.log(message);

  if (exitCode !== undefined) {
    process.exit(exitCode);
  }
}

function evalCmdl(){
  const argv = require('minimist')(process.argv.slice(2), {
    'string' : [
      'profile',
      'region'
    ],
    'boolean' : [ 'help', 'version' ],
    'alias' : {
      'envFile' : 'e',
      'help'    : 'h',
      'profile' : 'p',
      'region'  : 'r',
      'version' : 'v'
    },
    'default': {
      'envFile': '.env'
    }
  });

  if (argv.version) {
    const { version } = require('./package.json');
    console.log(`svcenv, Version ${version}`);
    process.exit(0);
  }

  if (argv.help) {
    showHelp(0);
  }

  if (!argv._[0] || !argv._[1]) {
    console.error('Must specify a ServiceName and SecretId');
    process.exit(1);
  }

  const ServiceName = argv._.shift();
  const SecretId = argv._.shift();
  const outputDir = argv._.shift() || CWD;
  const { envFile, profile, region } = argv;
  debug('evalCmdl:', { profile, region, ServiceName, SecretId, outputDir, envFile });
  return { profile, region, ServiceName, SecretId, outputDir, envFile };
}

function parseS3Key(v) {
  const m = v.match(/^s3:\/\/([\w-.]*)\/*(.*)$/);
  if (m) {
    return [ m[1], m[2] ];
  }
  return null;
}

function listObjects(s3, bucket, key) {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucket
    };
    if (key) {
      params.Prefix = key;
    }
    debug('attempt s3.listObjectsV2:', params);
    s3.listObjectsV2(params, (err, data) => {
      if (err) {
        return reject(err);
      }
      if (data.Contents) {
        return resolve(
          data.Contents.map(i => i.Key).filter(k => !k.match(/\/$/))
        );
      }
      debug('unexpected data:', data);
      return reject(new Error('unexpected response format'));
    });
  });
}

function getObject(s3, bucket, key, outputDir, flatten) {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucket,
      Key: key
    };
    debug('attempt s3.getObject:', params);
    s3.getObject(params, (err, data) => {
      if (err) {
        return reject(err);
      }
      if (!data.Body) {
        debug('unexpected data:', data);
        return reject(new Error('unexpected data format'));
      }

      const localPath = (flatten) ?
        path.join(outputDir, path.basename(key)) : path.join(outputDir, key);

      try {
        ensureDirSync(path.dirname(localPath));
        writeFileSync(localPath, data.Body);
        console.log(localPath);
        resolve(localPath);
      }
      catch(e) {
        reject(err);
      }
    });
  });
}

async function downloadBucket(region, keyPrefix, outputDir, flatten) {
  debug('attempt parseS3Key:', keyPrefix);
  const [ bucket, key ] = parseS3Key(keyPrefix);
  debug('parseS3Key returns:', bucket, key);
  const s3 = new aws.S3({ region });
  const keys = await listObjects(s3, bucket, key);
  if (!keys || !keys.length) {
    throw new Error(`Unable to locate any objects at bucket "${bucket}" key "${key}".`);
  }
  console.log(`Downloading ${keys.length} objects from s3 to ${outputDir}:`);
  return Promise.all(
    keys.map(k => getObject(s3, bucket, k, outputDir, flatten)));
}

function getSecretValue(region, SecretId) {
  debug('getSecretValue:', { region, SecretId });
  return new Promise((resolve, reject) => {
    const { SecretsManager } = aws;
    const sm = new SecretsManager({ region });
    sm.getSecretValue({ SecretId }, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(JSON.parse(data.SecretString));
    });
  });
}

async function getNodeId(serviceName) {
  debug(`getNodeId NODEID="${process.env.NODEID}"`);
  debug(`getNodeId ECS_CONTAINER_METADATA_URI="${process.env.ECS_CONTAINER_METADATA_URI}"`);
  const getRandomNodeId = () => {
    let rnd = Math.round(Math.random() * 99999).toString();
    while(rnd.length < 5) {
      rnd = `0${rnd}`;
    }
    return `${serviceName}-${Date.now()}-${rnd}`;
  };

  try {
    if (process.env.NODEID) {
      console.log(`Use NODEID ${process.env.NODEID} from environment.`);
      return process.env.NODEID;
    }

    if (process.env.ECS_CONTAINER_METADATA_URI) {
      const r = await needle('get', process.env.ECS_CONTAINER_METADATA_URI);
      if (r.body.TaskARN) {
        const m = r.body.TaskARN.match(/arn:aws:ecs:.*task\/(.*)$/);
        if (m[1]) {
          return `${serviceName}-${m[1].substr(0, 8)}`;
        }
      }
    }
    console.log('ECS_CONTAINER_METADATA_URI is missing from environment, use random nodeid.');
  }
  catch(e) {
    debug('needle error:', e.message);
    console.log('Failed to get task arn from ECS_CONTAINER_METADATA_URI, use random nodeid.');
  }

  return getRandomNodeId();
}

function dumpEnv(env, envFilePath) {
  debug(`dump env to ${envFilePath}:`, env);
  const buff = [];
  for (const envvar in env) {
    buff.push(`${envvar}=${env[envvar]}`);
  }
  writeFileSync(envFilePath, buff.join('\n'));
  console.log(`Environment file written to "${envFilePath}"`);
}

((async () => {
  try {
    const { profile, region, SecretId, ServiceName, outputDir, envFile } = evalCmdl();

    if (profile) {
      debug(`setCredentials(${profile})`);
      setCredentials(profile);
    }

    const secretEnv = await getSecretValue(region, SecretId);
    secretEnv.NODEID = await getNodeId(ServiceName);

    dumpEnv(secretEnv, path.join(outputDir, envFile));

    const keyPrefix = process.env.LIFEIO_DEPLOYMENT_BUCKET
      || secretEnv.LIFEIO_DEPLOYMENT_BUCKET;
    if (keyPrefix) {
      if (!keyPrefix.match(/^s3:\/\//)) {
        throw new Error(
          'The DEPLOYMENT_BUCKET setting must use form s3://[bucket]/[keyPrefix].');
      }
      await downloadBucket(region, keyPrefix, outputDir, true);
    }
  }
  catch(e) {
    console.error(e);
    process.exit(1);
  }
})());
