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
            'Authorization': 'Basic ' + Buffer.from('thanhpx04@gmail.com:9Pa8Y6rYdxcQjcrn6A6g6C04').toString('base64')
        }
    });
    const data = await response.json();
    return data;
});

export const handler = resolver.getDefinitions();

