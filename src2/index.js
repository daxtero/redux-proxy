import { each, map, isUndefined } from 'lodash';

import Model from './model';
import Entity from './entity';
import Media from './media';
import Serial from './serial';
import Season from './serial/season';
import Episode from './serial/episode';

const serial = new Serial({
    id: 'serial_id_1',
    name: 'First serial'
});

console.log(serial);

window.serial = serial;
window.Model = Model;
window.Entity = Entity;
window.Media = Media;
window.Serial = Serial;
window.Season = Season;
window.Episode = Episode;
