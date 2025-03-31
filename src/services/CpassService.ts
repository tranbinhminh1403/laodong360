import axios from "axios";
import dotenv from "dotenv";
import { Orders } from "../entities/Orders";
// import { getFormattedVietnamTime } from "../utils/dateTime";

dotenv.config();

const ZNS_BASEURL = process.env.ZNS_BASEURL;
const ZNS_OA_ID = process.env.ZNS_OA_ID;
const ZNS_TEMPLATE_ID = process.env.ZNS_TEMPLATE_ID;
const ZNS_API_KEY = process.env.ZNS_API_KEY;
const ZNS_SURVEY_TEMPLATE_ID = process.env.ZNS_SURVEY_TEMPLATE_ID;


// interface UpdateOrderResponse { 
//     phoneNumber: string;
export const sendZNS = async (order: Partial<Orders>): Promise<any> => {
    try {
        const body = {
            oa_id: ZNS_OA_ID,
            phone: order.phoneNumber,
            template_id: ZNS_TEMPLATE_ID,
            template_data: {
                Ten_khach_hang: order.fullName, 
                ma_khach_hang: order.phoneNumber,
                goi_dich_vu: order.title,
                van_de_can_tu_van: order.note,
                thoi_gian_tu_van: order.time ? new Date(order.time).toISOString().replace('T', ' ').substring(0, 19) : ''
            },
        }
        const response = await axios.post(`${ZNS_BASEURL}/vendor/v1/zalo/send-zns`, body, {
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*',
                'API-KEY': ZNS_API_KEY
            }
        });
        return response;
    } catch (error: any) {
        return {
            success: false, 
            error: error.message,
            message: "Failed to send ZNS",
            details: error.response?.data
        }
    }
}

export const sendSurveyZNS = async (updateOrderRes: Partial<Orders>): Promise<any> => {
    try {

        const body = {
            oa_id: ZNS_OA_ID,
            phone: updateOrderRes.phoneNumber,
            template_id: ZNS_SURVEY_TEMPLATE_ID,
            template_data: {
                Ten_khach_hang: updateOrderRes.fullName, 
                // ma_khach_hang: updateOrderRes.phoneNumber,

                bill_id: updateOrderRes.mrc_order_id,
                date: updateOrderRes.createdAt ? new Date(updateOrderRes.createdAt).toLocaleString('vi-VN') : ''
            },

        }
        const response = await axios.post(`${ZNS_BASEURL}/vendor/v1/zalo/send-zns`, body, {
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*',
                'API-KEY': ZNS_API_KEY
            }
        });
        return response;
    } catch (error) {
        console.error('Error sending ZNS:', error);
        throw error;
    }
}