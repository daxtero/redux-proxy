import Entity from './entity';

export default class Media extends Entity {

    static getClassOf(object) {
        switch (object && object.type) {
            case 'movie':
            case 'film':
                return Movie;
            case 'serial':
                return Serial;
            case 'season':
                return Season;
            case 'episode':
                return Episode;
            case 'channel':
                return Channel;
            default:
                return null;
        }
    }

}
