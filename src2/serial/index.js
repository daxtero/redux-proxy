import Media from '../media';

import Season from './season';
import Episode from './episode';

export default class Serial extends Media {

    static getSchema = () => ({
        seasons: (serial) => Season.getBySerialId(serial.id),
        episodes: (serial) => Episode.getBySerialId(serial.id),
        url: (serial) => '/serial/' + serial.slug
    });

    static fetch(params) {
        return Promise.resolve({
            id: 'serial_id_1',
            name: 'First serial',
            slug: 'first'
        });
    }

}
