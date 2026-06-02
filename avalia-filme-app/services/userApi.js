import axios from "axios";

const instance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

export async function userSignUp(user) {
  const response = await instance.post("/users/add", user);
  return response.data;
}

export async function userLogin(credentials) {
  const response = await instance.post("/users/login", credentials);
  return response.data;

}

export async function getAllUsers() {
  const response = await instance.get("/users/allUsers");
  return response.data;
}

export async function getUserById(id) {
  const response = await instance.get(`/users/user/${id}`);
  return response.data;
}

export async function updateUser(id, data) {
  const response = await instance.put(`/users/update/${id}`, data);
  return response.data;
}

export async function deleteUser(id) {
  const response = await instance.delete(`/users/user/${id}`);
  return response.data;
}
