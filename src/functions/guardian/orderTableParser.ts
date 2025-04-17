import * as cheerio from 'cheerio';

export interface WorkOrder {
  workOrderNumber: string;
  workOrderLink: string;
  ticketNumber: string;
  customerName: string;
  claims: string[];
  serviceType: string;
  address: string;
  status: string;
  daysRemaining: string;
  detailsLink: string;
}

export function parseWorkOrdersTable(html: string): WorkOrder[] {
  const $ = cheerio.load(html);
  const workOrders: WorkOrder[] = [];

  $('table tbody tr').each((_, element) => {
    const $row = $(element);
    workOrders.push({
      workOrderNumber: $row.find('td:first-child a').text().trim(),
      workOrderLink: $row.find('td:first-child a').attr('href') || '',
      ticketNumber: $row.find('td:nth-child(2)').text().trim(),
      customerName: $row.find('td:nth-child(3)').text().trim(),
      claims: $row.find('td:nth-child(4) li').map((_, el) => $(el).text().trim()).get(),
      serviceType: $row.find('td:nth-child(5)').text().trim(),
      address: $row.find('td:nth-child(6)').text().trim(),
      status: $row.find('td:nth-child(7) .status-pending').text().trim(),
      daysRemaining: $row.find('td:nth-child(7) .ml-2').text().trim(),
      detailsLink: $row.find('td:last-child a').attr('href') || ''
    });
  });

  return workOrders;
} 