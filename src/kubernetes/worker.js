class Worker {
    constructor(cluster, spec) {
        this.cluster = cluster;
        this.spec = spec;
    }
    async launch(args) {
        let k8sSpec = {
            apiVersion: "batch/v1",
            kind: "Job",
            metadata: { name: this.spec.name },
            spec: {
                template: {
                    spec: {
                        containers: [{
                            name: this.spec.name,
                            image: this.spec.image,
                            args: args
                        }],
                        restartPolicy: 'Never'
                    }
                },
                backoffLimit: 4
            }
        };
        this.jobInfo = await this.cluster.deploy(k8sSpec);
        return this;
    }
}

module.exports = Worker;