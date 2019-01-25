const Worker = require('./worker');
const slug = require('slug');

class KubernetesCluster {
    constructor(k8s) {
        this.k8s = k8s;
    }
    createWorker(spec) {
        let worker = new Worker(this, spec);
        return worker;
    }
    async deploy(workloadSpec, namespace, { redeploy = true } = {}) {
        return this.k8s.deployWorkload(workloadSpec, namespace).catch(err => {
            if (redeploy) {
                return this.k8s.updateWorkloads(workloadSpec, namespace);
            } else {
                throw err;
            }
        });
    }
    async getSecret(key, namespace) {
        return this.k8s.getObject('secrets', key, namespace);
    }
    async createSecret(key, value, namespace) {
        let secretSpec = {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: {
                name: key,
                namespace
            },
            type: 'Opaque',
            data: value
        };
        XLR8.Logger.debug("Secret spec", secretSpec);
        return this.k8s.createObject('secrets', secretSpec, namespace);
    }
    makeObjectKey(sourceKey) {
        return slug(sourceKey, { lower: true, replacement: '-' });
    }
}

module.exports = KubernetesCluster;