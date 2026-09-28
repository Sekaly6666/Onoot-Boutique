import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'client' | 'admin';
  status: 'actif' | 'inactif';
  joinDate: string;
};

/**
 * Fetch the list of users from the admin API.
 */
const fetchUsers = async (): Promise<User[]> => {
  const token = localStorage.getItem('adminToken');
  const res = await fetch('/api/admin/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
};

/**
 * Delete a user by id.
 */
const deleteUser = async (id: string): Promise<void> => {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
};

/**
 * Custom hook exposing users query and delete mutation.
 */
export const useUsers = () => {
  const queryClient = useQueryClient();

  const usersQuery = useQuery<User[], Error>({ queryKey: ['users'], queryFn: fetchUsers });

  const deleteUserMutation = useMutation<void, Error, string>({
    mutationFn: deleteUser,
    onSuccess: () => {
      // Invalidate the users list to refetch automatically.
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    usersQuery,
    deleteUser: deleteUserMutation,
  };
};
