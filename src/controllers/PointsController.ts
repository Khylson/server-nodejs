import {Request, Response} from 'express';
import knex from '../database/connection';

class PointsController {
    async list (request: Request, response: Response)  {
        const point = await knex('points').select('*');
    
        const serializedIPoints = point.map(point => {
            return{
                id: point.id,
                nome: point.nome,
                image: point.image,
                email: point.email,
                whatsapp: point.whatsapp,
                latitude: point.latitude,
                longitude: point.longitude,
                city: point.city,
                uf: point.uf
            }
        });
    
        return response.json(serializedIPoints);
    }

    async index (request: Request, response: Response){
        const {city, uf, items } = request.query;

        const parsedItems = String(items)
        .split(",")
        .map(item => Number(item.trim()));

        const points = await knex('points')
        .join('point_items', 'points.id', '=', 'point_items.point_id')
        .where('point_items.item_id', parsedItems)
        .where('city', String(city))
        .where('uf', String(uf))
        .distinct()
        .select('point.*');

        return response.json(points);
    }
    async create (request: Request, response: Response) {
        const {
            nome,
            image,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = request.body;
    
        const trx = await knex.transaction();

        const point = {
            nome,
            image: 'https://images.unsplash.com/photo-1556767576-5ec41e3239ea?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60',
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };
    
       const insertedIds = await trx('points').insert(point);
    
        const point_id = insertedIds[0];
    
        const pointItems = items.map((item_id: Number) => {
            return{
                item_id,
                point_id,
            };
        });
        await trx('point_items').insert(pointItems);
    
        await trx.commit();

        return response.json({ 
            id: point_id,
            ...point,
        });
    }

    async show (request: Request, response: Response) {
        const {id} = request.params;

        const point = await knex('points').where('id', id).first();

        if(!point){
            return response.status(400).json({ message: 'Point not found'});
        }

        const items = await knex('items')
        .join('points_items', 'items.id', '=', 'point_items.id')
        .where('point_items.point_id', id)
        .select('items.titulo');
        
        return response.json({point, items});
    }
}

export default PointsController;