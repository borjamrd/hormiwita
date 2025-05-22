import { create } from 'zustand';

interface UserData {
  // Define the structure of your user data here
  // For example:
  name: string;
  email: string;
  // Add other user-related fields as needed
}

interface UserStore {
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
}

const useUserStore = create<UserStore>((set) => ({
  userData: null,
  setUserData: (data) => set({ userData: data }),
}));

export default useUserStore;