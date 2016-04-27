import Model from './model';

// Redux-like store :-)
const entities = window.entities = {};
const cache = window.cache = {};

export default class Entity extends Model {

    constructor(values) {
        super(values);

        // Don't save to cache here, do it in fetch method
        if (this.id) {
            const alias = Entity.getClassAlias(this.constructor);
            if (!entities[alias]) {
                entities[alias] = {};
            }
            entities[alias][this.id] = this;
        }
    }

    static getClassAlias(Class) {
        return Class.name;
    }

    static getCacheKey(params) {
        return JSON.stringify(params);
    }

}

Entity.get = function(params) {
    let Class = this;

    const cached = Class.getFromCache(params);
    if (cached) { return cached; }

    const value = {
        pending: true
    };

    // Add pending value to cache
    const alias = Entity.getClassAlias(Class);
    const key = Entity.getCacheKey(params);
    if (!cache[alias]) {
        cache[alias] = {};
    }
    cache[alias][key] = value;

    // Fetch
    Class.fetch(params)
        .then((response) => {
            // todo Normalize and charge
            cache[alias][key] = response;
            if (response.id) {
                if (!entities[alias]) {
                    entities[alias] = {};
                }
                entities[alias][key] = new Class(response);
            }
            if (response instanceof Array) {
                for (let instance of response) {
                    if (instance.id) {
                        if (!entities[alias]) {
                            entities[alias] = {};
                        }
                        entities[alias][key] = new Class(instance);
                    }
                }
            }
        })
        .catch((error) => {
            // todo
            cache[alias][key] = error;
        });

    return value;
};

Entity.getFromCache = function(params) {
    const Class = this;

    if (!params) {
        return null;
    }

    const alias = Entity.getClassAlias(Class);
    if (typeof params === 'string' || typeof params === 'number') {
        return entities[alias] && entities[alias][params] || null;
    }

    if (params instanceof Array) {
        let success = true;
        const result = [];
        for (let id of params) {
            if (typeof id === 'number' && typeof id === 'string') {
                let entity = entities[alias] && entities[alias][id];
                if (entity) {
                    result.push(entity);
                    continue;
                }
            }
            success = false;
            break;
        }
        if (success) {
            return result;
        }
    }

    const key = Entity.getCacheKey(params);
    return cache[alias] && cache[alias][key] || null;
};
