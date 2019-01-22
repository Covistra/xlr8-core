const Worker = require('./worker');

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
}

module.exports = KubernetesCluster;