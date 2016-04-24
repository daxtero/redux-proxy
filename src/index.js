import get from 'lodash/get';
import each from 'lodash/each';

import EntitySchema from 'normalizr/lib/EntitySchema';
import ArraySchema from 'normalizr/lib/IterableSchema';
import UnionSchema from 'normalizr/lib/UnionSchema';

import {
    normalize as _normalize,
    Schema as _Schema,
    arrayOf,
    valuesOf,
    unionOf
} from 'normalizr';

import {
    REDUX_PROXY_PENDING,
    REDUX_PROXY_SUCCESS,
    REDUX_PROXY_FAILURE,
    REDUX_PROXY_ENTITIES
} from './reducers';


/**
 * @type {Object}
 */
const pending = { pending: true };


/**
 * @type {Error}
 */
const lost = new Error('Entity not found'); lost.error = lost;


/**
 * Map of all schemas
 * @type {Object}
 */
const schemas = {};


/**
 * Proxy schema class
 */
class Schema extends _Schema {
    constructor(key, options = {}) {
        super(key, options);
        schemas[key] = this;
    }
}


/**
 * Proxy class
 */
class Proxy {

    /**
     * Data provider constructor
     * @param {Schema} schema
     * @param {Function} getCacheState
     * @param {Function} getEntitiesState
     * @param {Function} dispatch
     * @param {Function} fetcher
     */
    constructor(schema, getCacheState, getEntitiesState, dispatch, fetcher) {
        this.schema = schema;
        this.getCacheState = getCacheState;
        this.getEntitiesState = getEntitiesState;
        this.dispatch = dispatch;
        this.fetcher = fetcher;
    }


    /**
     * Function that returns entites from store by params
     * @param  {*} params Request params, it must by plain object for making hash
     * @return {Object} Request result object or entity
     */
    get(params) {

        let key;
        let cached = this.getResultFromCacheByParams(params);
        if (!cached) {
            key = this.getCacheKey(params);
            cached = this.getFromCacheByKey(key);
        }
        if (cached) {
            if (cached instanceof Array || typeof cached === 'number' || typeof cached === 'string') {
                return this.hydrateResult(cached);
            }
            return cached;
        }

        let value = pending;

        this._dispatchRequest(key, value, params);

        const promise = this.fetcher(params);
        const valid = promise && typeof promise.then === 'function' && typeof promise.catch === 'function';

        if (!valid) {
            throw new Error('Invalid proxy fetcher result, Promise instance expected');
        }

        promise
            .then((response) => this.normalizeResponse(response, params))
            .then((response) => this._normalizeResponseBySchema(response, params))
            .then((normalized) => this._dispatchSuccess(key, normalized.result, normalized.entities))
            .catch((error) => this._dispatchFailure(key, error));

        return value;
    }


    /**
     * @param {*} params
     * @returns {String}
     * @private
     */
    getCacheKey(params) {
        if (typeof params === 'object' && !(params instanceof Array)) {
            const result = {};
            const keys = Object.keys(params).filter((key) => key[0] !== '_');
            each(keys, (key) => result[key] = params[key]);
            return JSON.stringify(result);
        }
        return JSON.stringify(params);
    }


    /**
     * @param {*} params
     * @returns {Object}
     */
    normalizeParams(params) {
        return params;
    }


    /**
     * @param {Object} response
     * @param {*} params
     * @returns {Object}
     * @private
     */
    normalizeResponse(response, params) {
        if (typeof Response === 'function' && response instanceof Response) {
            if (response.ok) {
                return response.json();
            } else {
                const error = new Error(response.status + ' ' + response.statusText);
                error.response = response;
                throw error;
            }
        }
        return response;
    }


    /**
     * @param {*} params
     * @returns {*}
     * @private
     */
    getResultFromCacheByParams(params) {
        let ids;
        const isArray = params instanceof Array;
        if (params instanceof Array) {
            ids = params;
        } else if (typeof params === 'number' || typeof params === 'string') {
            ids = [ params ];
        } else {
            return null;
        }
        if (!ids) { return null; }
        if (!ids.length) { return []; }

        const state = (this.getEntitiesState() || {})[this.schema.getKey()];
        if (!state) { return null; }

        const result = [];
        for (let id of ids) {
            if (state[id]) {
                result.push(id);
            } else {
                return null;
            }
        }

        return isArray ? result : result[0];
    }


    /**
     * @param key
     * @returns {*}
     * @private
     */
    getFromCacheByKey(key) {
        const state = this.getCacheState();
        const type = this.schema.getKey();
        return state && state[type] && state[type][key];
    }


    /**
     * @param {*} result
     * @returns {Object}
     * @private
     */
    hydrateResult(result) {
        const state = (this.getEntitiesState() || {})[this.schema.getKey()];
        if (!state) { return result; }

        if (result instanceof Array) {
            const list = [];
            result.forEach((id) => {
                let value = state && state[id];
                if (value) {
                    list.push(value);
                }
            });
            return list;
        }

        return state && state[result] || lost;
    }


    /**
     * @param {Object} response
     * @param {*} params
     * @returns {Object}
     * @private
     */
    _normalizeResponseBySchema(response, params) {
        if (params._schema) {
            return normalize(this, response, params._schema);
        }
        if (response instanceof Array) {
            return normalize(this, response, arrayOf(this.schema));
        } else {
            return normalize(this, response, this.schema);
        }
    }


    /**
     * @param {String} type
     * @param {Object} [payload]
     * @param {Object} [error]
     * @private
     */
    _dispatch(type, payload, error) {
        setTimeout(() => this.dispatch({ type, payload, error }));
    }


    /**
     * @param {String} key
     * @param {pending} value
     * @param {*} [params]
     * @private
     */
    _dispatchRequest(key, value, params) {
        const type = this.schema.getKey();
        this._dispatch(REDUX_PROXY_PENDING, { type, key, value, params });
    }


    /**
     * @param {String} key
     * @param {*} value
     * @param {Object} entities
     * @private
     */
    _dispatchSuccess(key, value, entities) {
        const type = this.schema.getKey();
        this._dispatch(REDUX_PROXY_ENTITIES, entities);
        this._dispatch(REDUX_PROXY_SUCCESS, { type, key, value });
    }

    /**
     * @param {String} key
     * @param {Error} error
     * @private
     */
    _dispatchFailure(key, error) {
        const type = this.schema.getKey();
        const value = error;
        error.error = error;
        this._dispatch(REDUX_PROXY_FAILURE, { type, key, value }, value);
    }

}


/**
 * @param {Proxy} proxy
 * @param {Object} schema // todo
 * @param {Number|String|Array} ids
 * @param {boolean} strict
 * @returns {*}
 */
function getEntities(proxy, schema, ids, strict = false) {
    const isArray = ids instanceof Array;

    const key = schema instanceof ArraySchema ? schema.getItemSchema().getKey() : schema.getKey();

    const state = (proxy.getEntitiesState() || {})[key];
    if (!state) { return isArray && !strict ? [] : null; }

    const items = [];
    each(isArray ? ids : [ ids ], (id) => {
        if (state[id]) {
            items.push(state[id]);
        }
    });

    return isArray && (!strict || ids.length === items.length) ? items : (items[0] || null);
}


/**
 * @param {Proxy} proxy
 * @param {Object} entity
 * @param {string} key
 * @param {Schema} schema
 */
function hydrateEntitySchema(proxy, entity, key, schema) {
    Object.defineProperty(entity, key, {
        enumerable: true,
        configurable: true,
        get: getEntities.bind(null, proxy, schema, entity[key])
    });
}


/**
 * @param {Proxy} proxy
 * @param {Object} entity
 * @param {string} key
 * @param {ArraySchema} schema
 */
function hydrateArraySchema(proxy, entity, key, schema) {
    const _schema = schema.getItemSchema();

    if (_schema instanceof UnionSchema) {
        const getUnionItems = (proxy, items) => {
            const result = [];
            each(items instanceof Array ? items : [ items ], (item) => {
                const schema = schemas[item.schema];
                if (!schema) {
                    throw new Error('Schema "' + item.schema + ' " not found');
                }
                result.push(getEntities(proxy, schema, item.id));
            });
            return result;
        };
        Object.defineProperty(entity, key, {
            enumerable: true,
            configurable: true,
            get: getUnionItems.bind(null, proxy, entity[key])
        });
        return;
    }

    Object.defineProperty(entity, key, {
        enumerable: true,
        configurable: true,
        get: getEntities.bind(null, proxy, schema, entity[key])
    });
}


/**
 * @param {Proxy} proxy
 * @param {Object} entity
 * @param {string} key
 * @param {UnionSchema} schema
 */
function hydrateUnionSchema(proxy, entity, key, schema) {
    const value = entity[key];

    const _schema = get(schema.getItemSchema(), value.schema);
    if (!_schema) {
        throw new Error('Invalid unionOf item schema');
    }

    Object.defineProperty(proxy, entity, key, {
        enumerable: true,
        configurable: true,
        get:getEntities.bind(null, proxy, _schema, value.id)
    });
}

/**
 * @param {Object} entity
 * @param {string} key
 * @param {Function} callback
 */
function hydrateFunction(entity, key, callback) {
    Object.defineProperty(entity, key, {
        enumerable: true,
        configurable: true,
        get: callback.bind(entity, entity, entity[key])
    });
}


/**
 * @param {Proxy} proxy
 * @param {Object} entity
 * @param {string} key
 * @param {EntitySchema|ArraySchema|UnionSchema|Function} schema
 * @returns {*}
 */
function hydrate(proxy, entity, key, schema) {
    switch (true) {

        case schema instanceof EntitySchema:
            return hydrateEntitySchema(proxy, entity, key, schema);

        case schema instanceof ArraySchema:
            return hydrateArraySchema(proxy, entity, key, schema);

        case schema instanceof UnionSchema:
            return hydrateUnionSchema(proxy, entity, key, schema);

        case typeof schema === 'function':
            return hydrateFunction(entity, key, schema);

        default:
            return;
    }
}


/**
 * @param {Proxy} proxy
 * @param {Object} object
 * @param {EntitySchema|ArraySchema|UnionSchema} schema
 * @param {Object} options
 */
function normalize(proxy, object, schema, options = {}) {
    const normalized = _normalize(object, schema, options);

    if (normalized.entities) {
        each(normalized.entities, (entities, type) => {
            const schema = schemas[type];
            if (schema) {
                each(entities, (entity) => {
                    each(schema, (value, key) => {
                        if (key[0] === '_' || !(key in entity)) { return; }
                        hydrate(proxy, entity, key, value);
                    });
                });
            }
        });
    }

    return normalized;
}


/**
 * @param {Object} options
 * @param {Proxy} Class
 * @returns {Function}
 */
function create(options = {}, Class = null) {

    if (typeof options.getCacheState !== 'function') {
        throw new Error('Invalid getCacheState option, function expected');
    }

    if (typeof options.getEntitiesState !== 'function') {
        throw new Error('Invalid getEntitiesState option, function expected');
    }

    if (typeof options.dispatch !== 'function') {
        throw new Error('Invalid dispatch option, function expected');
    }

    // todo: Validate Class

    return function(schema, fetcher) {

        return new (Class || Proxy)(
            schema,
            options.getCacheState,
            options.getEntitiesState,
            options.dispatch,
            fetcher
        );

    };

}

export default create;

export {
    create,
    Proxy,

    Schema,
    arrayOf,
    valuesOf,
    unionOf,
};
