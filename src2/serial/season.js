import Entity from '../entity';

import Serial from '.';
import Episode from './episode';

export default class Season extends Entity {

    static getSchema() {
        return {
            serial: Serial,
            episodes: (season) => Episode.getBySeasonId(season.id),
            url: (season) => {
                const serial = Serial.get(season.serialId);
                if (!serial || serial.pending) {
                    return null;
                }
                return serial.url + '/' + season.number;
            }
        };
    }

    static fetch(params) {
        return new Promise((resolve) => {
            setTimeout(() => resolve([
                new Season({
                    id: 'season_id_1',
                    name: '1 season',
                    serialId: 'serial_id_1',
                    serial: 'serial_id_1', // <---
                    number: 1
                }),
                new Season({
                    id: 'season_id_2',
                    name: '2 season',
                    serialId: 'serial_id_1',
                    serial: 'serial_id_1', // <---
                    number: 2
                })
            ]), 3000);
        });
    }

    static getBySerialId(serialId) {
        return Season.get({ serial_id: serialId });
    }

}
