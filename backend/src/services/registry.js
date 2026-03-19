const axios = require('axios');

// Token cache per repo
const tokenCache = {};

async function getAuthToken(repo) {
  if (tokenCache[repo] && tokenCache[repo].expires > Date.now()) {
    return tokenCache[repo].token;
  }

  try {
    const res = await axios.get(
      `https://auth.docker.io/token?service=registry.docker.io&scope=repository:${repo}:pull`,
      { timeout: 10000 }
    );
    const token = res.data.token;
    tokenCache[repo] = { token, expires: Date.now() + 55 * 60 * 1000 }; // 55 min
    return token;
  } catch (e) {
    throw new Error(`Auth failed for ${repo}: ${e.message}`);
  }
}

async function getRegistryDigest(name, tag = 'latest') {
  try {
    // Handle GHCR
    if (name.startsWith('ghcr.io/')) {
      return await getGHCRDigest(name, tag);
    }

    // Normalize Docker Hub image name
    const repo = name.includes('/') ? name : `library/${name}`;
    const token = await getAuthToken(repo);

    const res = await axios.get(
      `https://registry-1.docker.io/v2/${repo}/manifests/${tag}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: [
            'application/vnd.docker.distribution.manifest.v2+json',
            'application/vnd.docker.distribution.manifest.list.v2+json',
            'application/vnd.oci.image.manifest.v1+json',
            'application/vnd.oci.image.index.v1+json',
          ].join(', '),
        },
        timeout: 15000,
      }
    );

    // Docker-Content-Digest header is the most reliable
    const digest = res.headers['docker-content-digest'];
    if (digest) return digest;

    // Fallback: hash the manifest body
    return `sha256:${require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(res.data))
      .digest('hex')}`;
  } catch (e) {
    console.error(`[registry] Failed to get digest for ${name}:${tag} — ${e.message}`);
    return null;
  }
}

async function getGHCRDigest(name, tag) {
  const token = process.env.GHCR_TOKEN;
  const repo = name.replace('ghcr.io/', '');

  const res = await axios.get(
    `https://ghcr.io/v2/${repo}/manifests/${tag}`,
    {
      headers: {
        Authorization: token ? `Bearer ${Buffer.from(token).toString('base64')}` : undefined,
        Accept: 'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.v2+json',
      },
      timeout: 15000,
    }
  );

  return res.headers['docker-content-digest'] || null;
}

module.exports = { getRegistryDigest };
