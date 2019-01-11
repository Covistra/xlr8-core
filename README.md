# XLR8 Core

`@xlr8/core` is the shared XLR8 foundation that is injected by XLR8 in all micro-services. It provides the framework and the building blocks
to quickly create a wide variety of micro-services or add new features through plugins. `@xlr8/core` brings a new assembly strategy to Node.JS, one
that is more aligned with enterprise development. The core provides a number of foundamental components but offer the capacity to anyone to create
more specialized components to increase reuse between development teams. 

## Concepts

Even if enterprises are more and more using a `startup approach` to software development, there will always be concerns that we need to consider in an 
enterprise context that might not be applicable to smaller companies or open-source projects. 

- **No one knows the full story**: You often need a team from multiple departments, with different perpsective to get the full requirements for a piece of software. It often means that as a developer, you won't be owning the code for its full useful life. Code must be structured for this reality. 
- **Software lives longer than developers**: Software must be easily maintainable and architected in a way to easily replace or evolve portions of it over time. Documentation is a nice to have, but up-to-date documentation is very hard, boring and expensive to maintain. Better structure things up so that the code is the doc. 
- **Reuse through code promotion**: This isn't a process that is everywhere, but few companies have the luxury to spend money on a dedicated *framework* team, responsible for developing and maintaining core components for many teams. It is easier to let teams innovate within the scope of a flexible framework, and gradually promote the best components to shared modules. There's always a certain amount of bookkeeping but innovation should come from development teams based on what they need, not through a disconnected engineering team building stuff that no one will use. This has the benefits that you never wait for a component. It's not there, you build it, for you need. 
- **Skill level vary greatly**: From one developer to the other, skills might not be the same. it's even truer in an enterprise where people are relocated to other departments and trained internally. The framework must hide as much complexity as possible, without becoming complex. 

There are many more concerns like integration, centralized data store, SOA. These concerns can be addressed technically while the one above are constraints that need to be addressed from an architectural or process level. 

### Why XLR8? 

Node.JS is an awesome runtime environment. The fact that we can use JavaScript everywhere greatly simplify development (no more reality switch). But if you look at most projects out there, most samples, they offer very little real life enterprise approaches. There are dozens of ways to create an Express service, hundreds of frameworks all solving the same problems a little bit differently. XLR8 is born from our enterprise experience in putting Node.JS in the hands of good Java or .Net developers. We can't leave every team selecting their approach, components out of the hundreds choices in the Node.JS ecosytem. This would quickly result in raw chaos and unmaintanable software. So we needed a foundation, flexible offering complete freedom to team to create their own extensions, but with clear structural rules, which modules were allowed and how to structure and test components. Our work included the whole dev-ops process, so building, testing and deploying Docker images in four (4) different environments. 

XLR8 is an evolution of this work. A simpler core framework, with a number of pick-and-choose plugins based on your service need. The framework targets exclusively Kubernetes and provides everything your need, from an operation standpoint, to quickly create, test and deploy business micro-services and complex web and mobile apps using React. 

We believe that Node.JS, with a framework like XLR8, is ready for enterprise adoption and can generate great productivity and cost benefits compared to classic Java or .Net platforms. But for this to happen, we must draw the line between order and chaos and create a framework that is lightweight yet structuring enough to ensure maintainability and code consistency. We believe that XLR8 has the right mix to help Java or .Net developers move to Node.JS, with a good safety net, common patterns but with the benefits of JavaScript and the rich ecosystem of modules.

## Process

The root component of any XLR8 service is a `Process` instance. The process (which is different from the Node.JS process object) acts as a container for all kinds of components that will be discovered at startup. The process instance will load all plugins and component loaders, which will register all components. These components are loosely coupled and will ask collaborators to the process either at initialization time or later at runtime. The actual dependency management is quite simple (by design) and can be used in a variety of ways depending on the need. 

Once all plugins, loaders and components are loaded and initialized, the process is started. 

Components are located dynamically in all registered source paths (see plugins). It means that service projects can have any kind of physical file structure, as long as files are properly named and contain a single component. For example, a schema loader might look for **/*.schema.js files in all
source paths. it means that a single loader will be able to load core schemas (from this module), project specific schemas as well as any schemas added by plugins. This offer great flexibility. 


### Resolving dependencies



## Plugins

XLR8 plugins are simple modules that will register additional source paths in the process in which they are loaded. All files contained in the module, mostly loaders and components, will be added to the process and available through dependency resolution. Plugins are usually published in an NPM registry (either local, private or public) and are used to reuse related components. As part of the XLR8 foundation, we offer a number of key plugins that can be used to quickly create business oriented micro-services (see mongodb and rest plugins). 

## Loaders

Loaders are special components that can be used to create new kinds of components that will be registered in the process at runtime. Loaders are in fact, the only component type that is recognized by the core itself, everything else is discovered through loaders. All loaders must be created in a registered source path and must be named `*.loader.js`. As long as the `.loader.js` extension is found, the loader will be added to the process and will be asked to load it's own components. Loaders can be simple, just declaring their supported extension or complex, wrapping the content of the file (js, yaml, json, medias, etc) in JavaScript objects to be easily manipulated by other components. Loaders have full control over how they represent components in memory. 

The core comes with a number of loaders (schema, api, etc. ) that provides easy to use common components to all services. 

### Creating a component

A component is a simple nodejs module (file) with a specific extension exporting a factory like this: 

```js
module.exports = function({ proc, logger, context }) {
    // return your component here
}
```

The loader will pass a few components as parameters, including the current process, a component specific logger and