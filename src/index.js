import Resolver from '@forge/resolver';
import { fetch } from '@forge/api';
const resolver = new Resolver();

resolver.define('getText', (req) => {
    console.log(req);

    return 'Hello, world!';
});

resolver.define('getTeams', async ({ payload }) => {
    const response = await fetch('https://testpluginsteam.atlassian.net/rest/teams/1.0/teams/find', {
        body: JSON.stringify({
            "excludedIds": [],
            "maxResults": 10,
            "query": payload.title
        }), method: 'POST',
        headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            'Authorization': 'Basic ' + Buffer.from('abhi.scorpio61195@gmail.com:ATATT3xFfGF0uXoRZxA9xiRCGDtljRvN0NA8VdeINHxOzmhWq0jxJIbSeLCEYANH_wG8OjLQr02bTuD4YQpxUW4TV4FIKCgBpTZQle5b_lJFiiFWb1_fFh_qsq0ZCSbxPnq8gmMKoddIxoyK5AZG8G9oBg0Nn_t-t8jfNCW6CNqhHdV_ml0rcbU=0668E6F3').toString('base64')
        }
    });
    const data = await response.json();
    return data;
});

export const handler = resolver.getDefinitions();

