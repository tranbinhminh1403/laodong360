import { AppDataSource } from "../config/data-source";
import { Orders } from "../entities/Orders";

const orderRepository = AppDataSource.getRepository(Orders);

export const createOrder = async (orderData: Partial<Orders>) => {
    const newOrder = orderRepository.create(orderData);
    return await orderRepository.save(newOrder);
};


export const getAllOrders = async () => {
    return await orderRepository.find({
        order: {
            createdAt: 'DESC'
        }
    });
};

export const getOrderByOrderId = async (order_id: number): Promise<Orders | null> => {
    try {
        return await orderRepository.findOne({
            where: { order_id }
        });
    } catch (error: any) {
        throw new Error(`Lỗi khi tìm đơn hàng: ${error.message}`);
    }
};

export const getOrderByMrcOrderId = async (mrc_order_id: string): Promise<Orders | null> => {
    try {
        return await orderRepository.findOne({
            where: { mrc_order_id }
        });
    } catch (error: any) {
        throw new Error(`Lỗi khi tìm đơn hàng: ${error.message}`);
    }
};



export const updateOrderStatus = async (id: string, status: string): Promise<Orders> => {
    try {
        const order = await orderRepository.findOne({
            where: { id }
        });
        
        if (!order) {
            throw new Error('Không tìm thấy đơn hàng');
        }

        order.status = status;
        return await orderRepository.save(order);
    } catch (error: any) {
        throw new Error(`Lỗi khi cập nhật trạng thái đơn hàng: ${error.message}`);
    }
};

export const getAllOrdersWithFilter = async (status?: string | string[]) => {
  try {
    const queryBuilder = orderRepository.createQueryBuilder('order')
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      if (Array.isArray(status)) {
        queryBuilder.where('order.status IN (:...status)', { status });
      } else {
        queryBuilder.where('order.status = :status', { status });
      }
    }

    return await queryBuilder.getMany();
  } catch (error: any) {
    throw new Error(`Error fetching orders: ${error.message}`);
  }
};
