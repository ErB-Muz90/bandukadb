import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, Shift, Product, Customer } from '../database/entities';

function round(n: number, dp = 2): number {
  return Number(n.toFixed(dp));
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction) private transactions: Repository<Transaction>,
    @InjectRepository(Shift) private shifts: Repository<Shift>,
    @InjectRepository(Product) private products: Repository<Product>,
    @InjectRepository(Customer) private customers: Repository<Customer>,
  ) {}

  async getDashboardSummary(businessId: string, from: Date, to: Date) {
    const txs = await this.transactions.find({ where: { businessId, status: 'completed' } });

    const inRange = txs.filter(tx => {
      const d = new Date(Number(tx.date));
      return d >= from && d <= to;
    });

    const totalRevenue = inRange.reduce((s, tx) => s + Number(tx.total), 0);
    const totalTransactions = inRange.length;
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const paymentBreakdown = { cash: 0, mpesa: 0, card: 0, bank_transfer: 0 };
    for (const tx of inRange) {
      for (const p of (tx.payments ?? []) as Array<{ method: string; amount: number; status: string }>) {
        if (p.status === 'failed') continue;
        const method = p.method as keyof typeof paymentBreakdown;
        if (method in paymentBreakdown) paymentBreakdown[method] += Number(p.amount);
      }
    }

    const periodMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodMs);
    const prevRevenue = txs
      .filter(tx => { const d = new Date(Number(tx.date)); return d >= prevFrom && d < from; })
      .reduce((s, tx) => s + Number(tx.total), 0);

    return {
      period: { from, to },
      revenue: {
        total: round(totalRevenue),
        growth: prevRevenue > 0 ? round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : null,
        previous: round(prevRevenue),
      },
      transactions: { total: totalTransactions, avgOrderValue: round(avgOrderValue) },
      paymentBreakdown: {
        cash: round(paymentBreakdown.cash), mpesa: round(paymentBreakdown.mpesa),
        card: round(paymentBreakdown.card), bankTransfer: round(paymentBreakdown.bank_transfer),
      },
    };
  }

  async getDailyRevenue(businessId: string, from: Date, to: Date) {
    const txs = await this.transactions.find({ where: { businessId, status: 'completed' } });
    const byDay: Record<string, { date: string; revenue: number; transactions: number }> = {};

    for (const tx of txs) {
      const d = new Date(Number(tx.date));
      if (d < from || d > to) continue;
      const key = d.toISOString().slice(0, 10);
      if (!byDay[key]) byDay[key] = { date: key, revenue: 0, transactions: 0 };
      byDay[key].revenue += Number(tx.total);
      byDay[key].transactions += 1;
    }

    return Object.values(byDay)
      .map(d => ({ ...d, revenue: round(d.revenue) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTopProducts(businessId: string, from: Date, to: Date, limit = 10) {
    const txs = await this.transactions.find({ where: { businessId, status: 'completed' } });
    const productMap: Record<string, { name: string; units: number; revenue: number }> = {};

    for (const tx of txs) {
      const d = new Date(Number(tx.date));
      if (d < from || d > to) continue;
      for (const item of (tx.items ?? []) as Array<{ productId?: string; name: string; quantity: number; finalPrice?: number; lineTotal?: number }>) {
        const key = item.productId ?? item.name;
        if (!productMap[key]) productMap[key] = { name: item.name, units: 0, revenue: 0 };
        productMap[key].units += Number(item.quantity ?? 1);
        productMap[key].revenue += Number(item.finalPrice ?? item.lineTotal ?? 0);
      }
    }

    return Object.entries(productMap)
      .map(([id, data]) => ({ id, ...data, revenue: round(data.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  async getShiftSummary(businessId: string, from: Date, to: Date) {
    const allShifts = await this.shifts.find({ where: { businessId } });
    const inRange = allShifts.filter(s => {
      const opened = s.openedAt ? new Date(s.openedAt) : null;
      return opened && opened >= from && opened <= to;
    });

    return {
      total: inRange.length,
      closed: inRange.filter(s => s.status === 'closed').length,
      open: inRange.filter(s => s.status === 'open').length,
      cashiers: [...new Set(inRange.map(s => s.employeeId).filter(Boolean))].length,
      shifts: inRange.map(s => ({
        id: s.id, shiftRef: s.shiftRef, employeeName: s.employeeName,
        status: s.status, openedAt: s.openedAt, closedAt: s.closedAt,
        openingFloat: Number(s.openingFloat), retainedFloat: Number(s.retainedFloat),
      })),
    };
  }

  async getInventorySnapshot(businessId: string) {
    const products = await this.products.find({ where: { businessId } });
    const lowStock = products.filter(p => Number(p.stock) <= 5 && Number(p.stock) >= 0);

    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      lowStockCount: lowStock.length,
      outOfStockCount: products.filter(p => Number(p.stock) === 0).length,
      inventoryValue: round(products.reduce((s, p) => s + Number(p.costPrice ?? 0) * Number(p.stock ?? 0), 0)),
      lowStockItems: lowStock.slice(0, 20).map(p => ({
        id: p.id, name: p.name, sku: p.sku, stock: Number(p.stock), category: p.category,
      })),
    };
  }

  async getCustomerInsights(businessId: string, from: Date, to: Date) {
    const allCustomers = await this.customers.find({ where: { businessId } });
    const txs = await this.transactions.find({ where: { businessId, status: 'completed' } });

    const newIds = new Set<string>();
    const returningIds = new Set<string>();
    for (const tx of txs) {
      if (!tx.customerId) continue;
      const d = new Date(Number(tx.date));
      if (d < from || d > to) continue;
      const customer = allCustomers.find(c => c.id === tx.customerId);
      if (!customer) continue;
      if (d >= from) newIds.add(tx.customerId);
      else returningIds.add(tx.customerId);
    }

    return {
      totalCustomers: allCustomers.length,
      newThisPeriod: newIds.size,
      returning: returningIds.size,
      topCustomers: allCustomers
        .sort((a, b) => Number(b.totalSpent) - Number(a.totalSpent))
        .slice(0, 10)
        .map(c => ({ id: c.id, name: c.name, phone: c.phone, totalSpent: round(Number(c.totalSpent)), points: c.points })),
    };
  }
}
