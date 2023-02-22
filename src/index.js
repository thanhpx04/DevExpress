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
            'Authorization': 'Basic ' + Buffer.from('thanhpx04@gmail.com:ATATT3xFfGF0huiuwJ42x4T23i7igb2_19hM2D1wI58GsHmjct7vyV5GMGDyfnn7899oa70CjM1n15x_rIZAy5fL6tj7Ex3BZiZtktCwv-avnM-ocT7zAmGJiipRTSU4zUW9J7Cw3BVAaxILkYgZAsVOh8cky_-eVHsrp9RabDftNC4SU8vCkH8=32FBFD7D').toString('base64')
        }
    });
    const data = await response.json();
    return data;
});

export const handler = resolver.getDefinitions();

