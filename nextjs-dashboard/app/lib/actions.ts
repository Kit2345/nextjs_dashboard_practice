'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// changing amount from string to number
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  // method works but data format might not be correct -> amount is string NOT number
  //   const rawFormData = {
  //     customerId: formData.get('customerId'),
  //     amount: formData.get('amount'),
  //     status: formData.get('status'),
  //   };

  // If you have a lot of entries can use this instead of above:
  //   const rawFormData = Object.fromEntries(formData.entries())

  // using Z to get data in format we need
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // Changing dollars to cents
  const amountInCents = amount * 100;

  // New date
  const date = new Date().toISOString().split('T')[0];

  // Adding new entry to database
  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    return {
      message: 'Database error: Failed to create invoice',
    };
  }
  // when database updated the path is revalidated and fresh data reloaded
  revalidatePath('/dashboard/invoices');

  // user is then redirected to the dashboard/invoices page
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  try {
    await sql`
  UPDATE invoices
  SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
  WHERE id = ${id}
    `;
  } catch (error) {
    return {
      message: `Database error. Failed to update invoice id: ${id}`,
    };
  }
  revalidatePath('/dashboard/invoices');

  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error) {
    return {
      message: `Database error. Failed to delete invoice id: ${id}`,
    };
  }
  revalidatePath('/dashboard/invoices');
}
