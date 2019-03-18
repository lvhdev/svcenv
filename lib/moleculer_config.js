module.exports = {
  getNatsConfig: (envvar = 'NATS_CLUSTER', defaultVal = 'NATS') => {
    if (!process.env[envvar]) {
      return process.env.TRANSPORTER || defaultVal;
    }
    const servers = process.env[envvar].split(',').map(v => v.replace(/ /g,''));
    return {
      type: 'NATS',
      options: { servers }
    };
  }
};
