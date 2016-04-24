export const REDUX_PROXY_PENDING = 'REDUX_PROXY_PENDING';
export const REDUX_PROXY_SUCCESS = 'REDUX_PROXY_SUCCESS';
export const REDUX_PROXY_FAILURE = 'REDUX_PROXY_FAILURE';
export const REDUX_PROXY_ENTITIES = 'REDUX_PROXY_ENTITIES';

export function cache(state = {}, action = {}) {

    let key;
    let type;
    let value;
    let entities;
    let changes;

    switch (action.type) {

        case REDUX_PROXY_SUCCESS:
            key = action.payload.key;
            type = action.payload.type;
            value = action.payload.value;
            entities = state[type] || {};
            changes = { [key]: value };
            return { ...state, [type]: { ...entities, ...changes } };

        case REDUX_PROXY_PENDING:
        case REDUX_PROXY_FAILURE:
            key = action.payload.key;
            type = action.payload.type;
            value = action.payload.value;
            entities = state[type] || {};
            changes = { [key]: value };
            return { ...state, [type]: { ...entities, ...changes } };

        default:
            return state;
    }

}

export function entities(state = {}, action = {}) {

    if (action.type !== REDUX_PROXY_ENTITIES) {
        return state;
    }

    const entities = action.payload;
    const changes = {};

    for (let type in entities) {
        if (!entities.hasOwnProperty(type)) { continue; }
        let entityList = entities[type];
        let newEntities = {};
        for (let id in entityList) {
            if (!entityList.hasOwnProperty(id)) { continue; }
            // todo merge current entity and entityList[id] with Schema
            newEntities[id] = entityList[id];
        }
        if (Object.keys(newEntities).length) {
            const currentEntities = state[type] || {};
            changes[type] = { ...currentEntities, ...newEntities };
        }
    }
    if (Object.keys(changes).length) {
        return { ...state, ...changes };
    }
    return state;

}
