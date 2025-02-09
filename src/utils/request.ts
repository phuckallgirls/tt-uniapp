/**
 * 网络请求工具类
 */
class Request {
    private baseUrl: string;

    constructor() {
        // 根据环境设置基础URL
        this.baseUrl = 'http://your-gateway-url';
    }

    /**
     * 发送请求
     * @param options 请求配置
     */
    async request<T>(options: UniApp.RequestOptions): Promise<T> {
        try {
            const response = await uni.request({
                url: this.baseUrl + options.url,
                method: options.method || 'GET',
                data: options.data,
                header: {
                    'Content-Type': 'application/json',
                    ...options.header,
                },
            });

            if (response.statusCode === 200) {
                return response.data as T;
            }
            throw new Error(`Request failed with status ${response.statusCode}`);
        } catch (error) {
            console.error('Request error:', error);
            throw error;
        }
    }
}

export const request = new Request(); 