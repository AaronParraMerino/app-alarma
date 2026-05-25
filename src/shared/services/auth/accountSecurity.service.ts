import { supabase } from '../../db/supabaseClient';

export type ChangePasswordInput = {
  email: string;
  currentPassword: string;
  newPassword: string;
};

export async function changePasswordWithCurrentPassword({
  email,
  currentPassword,
  newPassword,
}: ChangePasswordInput): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error('No se encontro el correo de la cuenta.');
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: currentPassword,
  });

  if (signInError) {
    throw new Error('La contraseña actual no es correcta.');
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error('No se encontro el correo de la cuenta.');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

  if (error) {
    throw new Error(error.message);
  }
}
