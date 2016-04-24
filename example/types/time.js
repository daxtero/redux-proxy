export default function time(entity, value) {

    if (!value) { return value; }

    let result;

    switch (typeof value) {

        case 'string':
            result = new Date(value);
            break;

        case 'number':
            result = new Date(value * 1000);
            break;

        default:
            break;
    }

    return isNaN(result) ? value : result;

}
