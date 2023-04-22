class ApiFeatures {
  constructor(queryStr, query) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i",
          },
        }
      : {};
    this.query = this.query.find({ ...keyword });
    return this;
  }
  filter() {
    const queryStrCopy = { ...this.queryStr };
    //   Removing some fields for category
    const array = ["keyword", "page", "limit"];

    array.forEach((key) => delete queryStrCopy[key]);

    // Filter For Price and Rating

    let queryStr = JSON.stringify(queryStrCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }
  pagination(result_per_page) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip_page = result_per_page * (currentPage - 1);
    this.query = this.query.limit(result_per_page).skip(skip_page);
    return this;
  }
}

export default ApiFeatures;
