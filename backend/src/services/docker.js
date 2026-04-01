const Docker = require('dockerode');

const docker = new Docker({
  host: process.env.DOCKER_HOST
    ? process.env.DOCKER_HOST.replace('tcp://', '').split(':')[0]
    : undefined,
  port: process.env.DOCKER_HOST
    ? parseInt(process.env.DOCKER_HOST.split(':').pop())
    : undefined,
  socketPath: process.env.DOCKER_HOST ? undefined : '/var/run/docker.sock',
});

async function getLocalImages() {
  const images = await docker.listImages({ all: false });
  const result = [];

  for (const img of images) {
    if (!img.RepoTags || img.RepoTags[0] === '<none>:<none>') continue;

    for (const repoTag of img.RepoTags) {
      if (repoTag === '<none>:<none>') continue;
      const [repo, tag] = repoTag.split(':');
      result.push({
        id: img.Id.replace('sha256:', '').substring(0, 12),
        fullId: img.Id,
        name: repo,
        tag: tag || 'latest',
        repoTag,
        localDigest: img.Id,
        size: img.Size,
        created: img.Created,
      });
    }
  }

  return result;
}

async function getContainersUsingImage(imageId) {
  const containers = await docker.listContainers({ all: true });
  return containers
    .filter(c => c.ImageID === imageId || c.Image === imageId)
    .map(c => ({
      id: c.Id.substring(0, 12),
      name: c.Names[0]?.replace('/', ''),
      status: c.Status,
      state: c.State,
    }));
}

// onProgress(event) is called for each pull event (layer progress)
// event shape: { status, progressDetail: { current, total }, id }
async function pullImage(repoTag, onProgress) {
  return new Promise((resolve, reject) => {
    docker.pull(repoTag, (err, stream) => {
      if (err) return reject(err);
      docker.modem.followProgress(
        stream,
        (err, output) => { if (err) reject(err); else resolve(output); },
        onProgress || null
      );
    });
  });
}

async function recreateContainer(containerId) {
  const container = docker.getContainer(containerId);
  const info = await container.inspect();

  // Stop and remove old container
  if (info.State.Running) await container.stop();
  await container.remove();

  // Recreate with same config
  const newContainer = await docker.createContainer({
    ...info.Config,
    name: info.Name.replace('/', ''),
    HostConfig: info.HostConfig,
    NetworkingConfig: {
      EndpointsConfig: info.NetworkSettings.Networks,
    },
  });

  await newContainer.start();
  return { id: newContainer.id.substring(0, 12), name: info.Name.replace('/', '') };
}

module.exports = { getLocalImages, getContainersUsingImage, pullImage, recreateContainer };
