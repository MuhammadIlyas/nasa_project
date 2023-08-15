const DEFULT_PAGE_LIMIT = 0; // in mongo if 0 , will return all the data
const DEFULT_PAGE_NUMBER = 10;

function getPagination(query) {
    const page = Math.abs(query.page) || DEFULT_PAGE_NUMBER;
    const limit = Math.abs(query.limit) || DEFULT_PAGE_LIMIT;
    const skip = (page -1)  * limit;

    return {
        skip,
        limit 
    }
}

module.exports = {
    getPagination
}