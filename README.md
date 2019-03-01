# svcenv
Utility for setting up Life.io service environments.

## Installation

```
# Global
$ npm install -g @lifeio/svcenv

# Local
$ npm install @lifeio/svcenv (run with npx)
```

## Usage
This utility is primarily intended for use with ECS task definitions to initialize a microservice container.  

### Environment
It will pull secrets stored in [AWS Secerets Manager](https://aws.amazon.com/secrets-manager/) under the SecretId key and dump them to an env file (default=./.env).  

### NODEID
The utilty will add a NODEID to the created .env file as well, using the following rules:

1. If it detects a NODEID from the current environment, this value will be written to the file as is.
2. If it finds the variable ECS_CONTAINER_METADATA_URI in the environment it will download the meta data and create a NODEDID using the ServiceName command line argument and the first eight characters of the ECS Task Id.
3. If the ECS_CONTAINER_METADATA_URI variable is not present OR there is an error extracting the Task Id, NODEID will be ServiceName-Date.now-5 digit random number.

### S3 DEPLOYMENT BUCKET
If the variable LIFEIO_DEPLOYMENT_BUCKET is found in the process env or the AWS Secret Manager env, it will be used to download the contents of the bucket to the outputDir (./).

**IMPORTANT** - The LIFEIO_DEPLOYMENT_BUCKET variable must be formatted s3://[bucket]/[keyPrefix].

### AWS Authentication
The utility can authenticate via IAM, or if running outside of AWS via authentication env vars, or it will use the ~/.aws/credentials file.  If using the credentials file, the --profile argument can be used to select the correct profile.

### DEBUGGING
The utilty uses the [debug](https://www.npmjs.com/package/debug) module.  To turn on debugging add ```DEBUG=*``` to the command line or your environment.

```

  Usage: svcenv [OPTIONS] ServiceName SecretId [outputDir]
  
  Options:
      -e,  --envFile      Name of envFile to dump in outputDir (default = ./.env)
      -h,  --help         Display help screen
      -p,  --profile      If using local ~/.aws credentials
      -r,  --region       Region to use for secrets lookup
      -v,  --version      Display version

```
