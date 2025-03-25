import { Order } from "../entities/order.entity";
import { IRepository } from "../../common/interfaces/repository.interface";

export interface IOrderRepository extends IRepository<Order> {}