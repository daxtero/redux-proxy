import { each, map, isUndefined } from 'lodash';

export default class Model {

    /**
     *
     * @param values
     */
    constructor(values) {

        if (typeof this.constructor.getSchema === 'function') {
            each(this.constructor.getSchema(), (attribute, key) => {
                if (key in this) {
                    throw new Error(this.constructor.name + ': invalid schema, object has own key "' + key + '"');
                }
                const charged = charge(this, attribute, values[key]);
                if (!isUndefined(charged)) {
                    const property = {
                        configurable: true,
                        enumerable: true
                    };
                    if (typeof charged === 'function') {
                        property.get = charged;
                    } else {
                        property.value = charged;
                    }
                    Object.defineProperty(this, key, property);
                }
            });
        }

        each(values, (value, key) => {
            if (key in this) { return; }
            this[key] = value;
        });

    }

}

/**
 * @params {*} params
 * @returns {*}
 */
Model.get = function(params) {
    throw new Error('Method ' + this.name +'.get method not implemented');
};


/**
 * @params {*} params
 * @returns {Promise}
 */
Model.fetch = function(params) {
    throw new Error('Method ' + this.name +'.fetch method not implemented');
};

const chargeObject = (object, Class, value) => () => {
    if (!value) {
        return null;
    }

    if (typeof value === 'number' || typeof value === 'string') {
        return Class.get(value);
    };

    if (typeof value === 'object' && !(value instanceof Array)) {
        const RealClass = Class.hasOwnProperty('getClassOf') ? Class.getClassOf(value) : Class;
        if (!RealClass) {
            throw new Error(Class.name + ' can not detect class of object');
        }
        return new RealClass(value);
    }

    throw new Error('Invalid object value, number, string or single object expected');
};

const chargeArray = (object, schema, values) => () => {

    let plainArray = true;
    for (let value of values) {
        if (typeof value !== 'number' && typeof value !== 'string') {
            plainArray = false;
            break;
        }
    }

    if (plainArray) {
        const cached = object.constructor.get(values);
        if (cached) {
            return cached;
        }
    }

    return values.map((value) => {
        return charge(object, schema[0], value)();
    });
};

function charge(object, attribute, value) {

    if (typeof attribute === 'function') {
        if (attribute === Model || Model.isPrototypeOf(attribute)) {
            return chargeObject(object, attribute, value);
        }
        return attribute.bind(object, object, value);
    }

    if (attribute instanceof Array) {
        return chargeArray(object, attribute, value);
    }

    return undefined;

}

export default Model;