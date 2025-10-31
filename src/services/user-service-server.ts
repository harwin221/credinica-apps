

'use server';

import { query } from '@/lib/mysql';
import type { CreateUserInput, AppUser, CreateUserOutput, UserRole } from '@/lib/types';
import * as bcrypt from 'bcryptjs';

export async function createFirstUser(
  userData: Omit<CreateUserInput, 'role' | 'branch' | 'status' | 'supervisorId' | 'phone'>
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const existingUsers: any = await query('SELECT id FROM users LIMIT 1');
    if (existingUsers.length > 0) {
      return { success: false, error: 'Ya existe un usuario en el sistema. Inicia sesión.' };
    }

    const hashedPassword = await bcrypt.hash(userData.password!, 10);
    const newUserId = `user_${Date.now()}`;
    const sucursalId = 'suc_main';

    // Ensure the main branch exists before creating the user that depends on it.
    const sucursalExists: any = await query('SELECT id FROM sucursales WHERE id = ?', [sucursalId]);
    if (sucursalExists.length === 0) {
      await query('INSERT INTO sucursales (id, name) VALUES (?, ?)', [sucursalId, 'SUCURSAL PRINCIPAL']);
    }

    const sql = `
        INSERT INTO users (id, fullName, email, hashed_password, role, sucursal_id, sucursal_name, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [newUserId, userData.displayName.toUpperCase(), userData.email.toLowerCase(), hashedPassword, 'ADMINISTRADOR', sucursalId, 'SUCURSAL PRINCIPAL', true]);
    
    return { success: true, userId: newUserId };
  } catch (error: any) {
    console.error("Error creating first user:", error);
    return { success: false, error: 'No se pudo crear el usuario administrador.' };
  }
}

export async function createUserService(
  input: CreateUserInput,
): Promise<CreateUserOutput> {
  const { displayName, email, password, phone, role, branch, status, supervisorId } = input;
  
  try {
    const hashedPassword = await bcrypt.hash(password!, 10);
    const newUserId = `user_${Date.now()}`;

    const supervisorResult: any = supervisorId ? await query('SELECT fullName FROM users WHERE id = ?', [supervisorId]) : [];
    const supervisorName = supervisorResult[0]?.fullName || null;
    
    let branchId: string | null;
    let branchName: string | null;

    if (branch === 'TODAS') {
        branchId = null; // Correct way to handle "no specific branch"
        branchName = 'TODAS';
    } else {
        const branchResult: any = await query('SELECT name FROM sucursales WHERE id = ?', [branch]);
        branchId = branch;
        branchName = branchResult[0]?.name || null;
    }

    const phoneValue = phone || null;
    const supervisorIdValue = supervisorId || null;

    const sql = `
        INSERT INTO users (id, fullName, email, hashed_password, phone, role, sucursal_id, sucursal_name, active, supervisor_id, supervisor_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [newUserId, displayName.toUpperCase(), email.toLowerCase(), hashedPassword, phoneValue, role.toUpperCase(), branchId, branchName, status, supervisorIdValue, supervisorName]);
    
    return { uid: newUserId, email: email, message: 'User created successfully in DB.' };
  } catch (error: any) {
    console.error("Error creating user in DB:", error);
    throw new Error(error.code === 'ER_DUP_ENTRY' ? 'El correo electrónico ya está en uso.' : 'No se pudo crear el usuario.');
  }
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<{success: boolean, error?: string}> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET hashed_password = ?, mustChangePassword = ? WHERE id = ?', [hashedPassword, false, userId]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'No se pudo actualizar la contraseña.' };
  }
}

export async function updateUserService(userId: string, userData: Partial<AppUser>): Promise<{ success: boolean; error?: string }> {
    try {
        const { fullName, email, phone, role, sucursal, sucursalName, active, supervisorId, supervisorName } = userData;
        const phoneValue = phone || null;
        const supervisorIdValue = supervisorId || null;
        const supervisorNameValue = supervisorName || null;
        
        let finalSucursalId = sucursal;
        let finalSucursalName = sucursalName;

        if (sucursal === 'TODAS') {
            finalSucursalId = null; // Correctly set ID to NULL
            finalSucursalName = 'TODAS';
        } else if (sucursal && !sucursalName) {
            const branchResult: any = await query('SELECT name FROM sucursales WHERE id = ?', [sucursal]);
            finalSucursalName = branchResult[0]?.name || null;
        }

        await query(
            'UPDATE users SET fullName = ?, email = ?, phone = ?, role = ?, sucursal_id = ?, sucursal_name = ?, active = ?, supervisor_id = ?, supervisor_name = ? WHERE id = ?',
            [fullName, email, phoneValue, role, finalSucursalId, finalSucursalName, active, supervisorIdValue, supervisorNameValue, userId]
        );
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user:", error);
        return { success: false, error: 'No se pudo actualizar el usuario.' };
    }
}

export async function resetUserPassword(uid: string): Promise<{success: boolean, error?: string}> {
  try {
      await query('UPDATE users SET mustChangePassword = ? WHERE id = ?', [true, uid]);
      return { success: true };
  } catch (error: any) {
      return { success: false, error: 'No se pudo resetear la contraseña.' };
  }
}

export const getUsers = async (): Promise<AppUser[]> => {
  const users: any = await query('SELECT u.id, u.fullName, u.email, u.phone, u.role, u.sucursal_id, u.sucursal_name, u.active, u.supervisor_id, u.supervisor_name FROM users u ORDER BY u.fullName');
  return users.map((u: any) => ({
      ...u,
      sucursal: u.sucursal_id,
      sucursalName: u.sucursal_name,
      supervisorId: u.supervisor_id,
      supervisorName: u.supervisor_name
  })) as AppUser[];
};

export async function getUser(id: string): Promise<AppUser | null> {
  const users: any = await query('SELECT u.id, u.fullName, u.email, u.phone, u.role, u.sucursal_id, u.sucursal_name, u.active, u.supervisor_id, u.supervisor_name FROM users u WHERE u.id = ? LIMIT 1', [id]);
  if (users.length === 0) return null;
  const user = users[0];
  return {
      ...user,
      sucursal: user.sucursal_id,
      sucursalName: user.sucursal_name,
      supervisorId: user.supervisor_id,
      supervisorName: user.supervisor_name
  } as AppUser;
}

export async function getUserByName(name: string): Promise<AppUser | null> {
  const users: any = await query('SELECT * FROM users WHERE fullName = ? LIMIT 1', [name]);
  if (users.length === 0) return null;
  const user = users[0];
  return {
      ...user,
      sucursal: user.sucursal_id,
      sucursalName: user.sucursal_name,
      supervisorId: user.supervisor_id,
      supervisorName: user.supervisor_name
  } as AppUser;
}

export async function deleteUserFromAuthAndDb(uid: string): Promise<void> {
  await query('DELETE FROM users WHERE id = ?', [uid]);
}
