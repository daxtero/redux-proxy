export default function(params) {

    const url = '//api.ladyn.ru/post/';

    if (params instanceof Array) {
        return fetch(url + '?post_ids=' + params.join(','));
    }

    if (typeof params === 'number' || typeof params === 'string') {
        return fetch(url + params);
    }

    if (typeof params === 'object') {

        if ('before_id' in params) {
            return fetch(url + '?before_id=' + (params.before_id || 0) + '&limit=' + (params.limit || 0));
        }

        if ('ids' in params) {
            return fetch(url + '?post_ids=' + (params.ids.join(',')) + '&limit=' + (params.limit || params.ids.length));
        }

    }

    return Promise.reject(new Error('Invalid posts params'));

}

