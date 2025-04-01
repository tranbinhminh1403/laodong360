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



export const updateOrderStatus = async (
  id: number, 
  status: string,
  updatedAt: Date = new Date()
): Promise<Orders | null> => {
  try {
    const order = await orderRepository.findOne({ where: { order_id: id } });
    if (!order) return null;

    order.status = status;
    order.updatedAt = updatedAt;
    await orderRepository.save(order);

    return order;
  } catch (error) {
    console.error('Error updating order status:', error);
    return null;
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
