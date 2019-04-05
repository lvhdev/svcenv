const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;

const metadata = JSON.stringify({
  'Labels': {
    'com.amazonaws.ecs.cluster': 'default',
    'com.amazonaws.ecs.container-name': 'metadaa',

    'com.amazonaws.ecs.task-arn': 'arn:aws:ecs:us-west-2:012345678910:task/2b88376d-aba3-4950-9ddf-bcb0f388a40c',
    'xxcom.amazonaws.ecs.task-arn': 'arn:aws:ecs:us-east-1:151645357890:task/cl0403-cluster-dev/1835da0edc97403dbbfe519127968bb5',
  },
  'ContainerID': '98e44444008169587b826b4cd76c6732e5899747e753af1e19a35db64f9e9c32',
	'ContainerInstanceARN':'arn:aws:ecs:us-west-2:012345678910:container-instance/1f73d099-b914-411c-a9ff-81633b7741dd',
	'DockerContainerName': '/ecs-metadata-7-metadata-f0edfbd6d09fdef20800',
	'ImageID': 'sha256:c24f66af34b4d76558f7743109e2476b6325fcf6cc167c6e1e07cd121a22b341',
	'ImageName': 'httpd:2.4',
	'PortMappings': [
		{
			'ContainerPort': 80,
			'HostPort': 80,
			'BindIp': '',
			'Protocol': 'tcp'
		}
	],
	'Networks': [
		{
			'NetworkMode': 'bridge',
			'IPv4Addresses': [
				'172.17.0.2'
			]
		}
	],
	'MetadataFileStatus': 'READY'
});

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(metadata);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
