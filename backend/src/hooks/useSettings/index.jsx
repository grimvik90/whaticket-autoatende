import api from "../../services/api";

let cachedSettings = [];

const useSettings = () => {


    const getCachedByKey = (key) => {
        if (!cachedSettings.length) {
            return null;
        }
        for (let cached of cachedSettings){
            if(cached.key === key){
                return cached;
            }
        }
    }
    const getCachedSetting = async (key) => {

        if (!cachedSettings.length) {
            cachedSettings = await getAll();
        }

        return getCachedByKey(key);
    }
    const getAll = async (params) => {
        const {data} = await api.request({
            url: '/settings',
            method: 'GET',
            params
        });
       // cachedSettings = data;
        return data;
    }

    const update = async (data) => {
        const {data: responseData} = await api.request({
            url: `/settings/${data.key}`,
            method: 'PUT',
            data
        });

        var found = false;
        for (let cached of cachedSettings){
            if(cached.key === data.key){
                cached.value = data.value;
                found = true;
            }
        }
        if (!found) {
            cachedSettings.push(data);
        }
        return responseData;
    }

    const getPublicSetting = async (key) => {
        const {data} = await api.request({
            url: `/public-settings/${key}`,
            method: 'GET'
        });
        return data;
    }

    const getAllPublicSetting = async (key) => {
        const {data} = await api.request({
            url: `/public-settings`,
            method: 'GET'
        });
        return data;
    }

    return {
        getAll,
        getPublicSetting,
        getAllPublicSetting,
        update,
        getCachedSetting
    }
}

export default useSettings;