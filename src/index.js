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
            'Authorization': 'Basic ' + Buffer.from('thanhpx04@gmail.com:ATATT3xFfGF0bjf9Pm0RkUxB0NPRW4UiA0u5xl0rXfXYtUu4DVTOJEzNaEPIDpRxTzEk3xbTOQw9y0g7zNLUEzZpGcxvGNmKTkIP_tS6FOmoKnGqgNLsEFvdM7SznlgQz-ljbab4rJV67OupLRQFdOoPZ_W9T80zFsVk_7fVRRXquqMYzoyd89A=7DBBB304').toString('base64')
        }
    });
    const data = await response.json();
    return data;
});

export const handler = resolver.getDefinitions();

