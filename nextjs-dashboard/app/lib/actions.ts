'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// changing amount from string to number
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer',
  }),
  amount: z.coerce.number().gt(0, {
    message: 'Please enter an amount greater than $0',
  }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select and invoice status',
  }),
  date: z.string(),
});

// use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerID?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// prevState - contains the state passed from the useFormState hook. You won't be using it in the action in this example, but it's a required prop.
export async function createInvoice(prevState: State, formData: FormData) {
  // method works but data format might not be correct -> amount is string NOT number
  //   const rawFormData = {
  //     customerId: formData.get('customerId'),
  //     amount: formData.get('amount'),
  //     status: formData.get('status'),
  //   };

  // If you have a lot of entries can use this instead of above:
  //   const rawFormData = Object.fromEntries(formData.entries())

  // using Z to get data in format we need
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validations fails, return erros early. Otherwise, continue
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
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

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Edit Invoice',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
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
