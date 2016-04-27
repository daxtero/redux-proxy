import Entity from '../entity';

import Serial from '.';
import Season from './season';

export default class Episode extends Entity {

    static getSchema() {
        return {
            season: Season,
            serial: Serial,
            url: (episode) => {
                const season = Season.get(episode.seasonId);
                if (!season || season.pending) {
                    return null;
                }
                return season.url + '/' + episode.number;
            }
        };
    }

    static fetch(params) {
        if (params && params.season_id) {
            const result = [];
            let count = Math.round(Math.random() * 7) + 3;
            let number = 0;
            while (++number <= count) {
                result.push(new Episode({
                    id: params.season_id + '_episode_id_' + number,
                    name: number + ' episode',
                    serialId: 'serial_id_1',
                    seasonId: params.season_id,
                    serial: 'serial_id_1',      // <----
                    season: params.season_id,   // <----
                    number: number
                }));
            }
            return new Promise((resolve) => {
                setTimeout(() => resolve(result), 3000);
            });
        }

        return Promise.reject(new Error('Invalid Episode.fetch params'));
    }


    static getBySeasonId(seasonId) {
        return Episode.get({ season_id: seasonId });
    }

    static getBySerialId(serialId) {
        const seasons = Season.getBySerialId(serialId);
        if (seasons.pending) {
            return {
                pending: true
            };
        }

        const seasonsEpisodes = [];
        for (let season of seasons) {
            seasonsEpisodes.push(Episode.getBySeasonId(season.id));
        }

        const result = [];
        for (let seasonEpisodes of seasonsEpisodes) {
            if (seasonEpisodes.pending) {
                return {
                    pending: true
                };
            }
            for (let episode of seasonEpisodes) {
                result.push(episode);
            }
        }

        return result;
    }

}
