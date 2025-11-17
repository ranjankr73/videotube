class ApiResponse {
    constructor(statusCode, message = "Success", data, meta) {
        Object.setPrototypeOf(this, new.target.prototype);

        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode >= 200 && statusCode < 400;

        if (meta) this.meta = meta;
    }

    toJSON() {
        return {
            success: this.success,
            message: this.message,
            data: this.data,
            ...(this.meta ? { meta: this.meta } : {}),
        };
    }
}

export { ApiResponse };
