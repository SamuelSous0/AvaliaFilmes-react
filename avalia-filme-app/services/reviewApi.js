import axios from "axios";

const instance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

export async function getAllReviews() {
  const response = await instance.get("/reviews");
  return response.data;
}

export async function getReviewsByFilme(filmeId) {
  const response = await instance.get(`/reviews/filme/${filmeId}`);
  return response.data;
}

export async function saveReview(review) {
  const response = await instance.post("/reviews", review);
  return response.data;
}

export async function updateReview(id, review) {
  const response = await instance.put(`/reviews/${id}`, review);
  return response.data;
}

export async function deleteReview(id) {
  const response = await instance.delete(`/reviews/${id}`);
  return response.data;
}
