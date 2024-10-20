export interface StandardResponse<T> {
    success: boolean;
    data: T
};

export interface Photo {
    _id: string,
    title: string,
    originalname: string,
    mimetype: string,
    path: string,
    size: number,
    created_by: {
        user_id: string,
        name: string,
        email: string
    },
    vote_count: number,
    comment_count: number,
    hasVoted: boolean
};

export interface Comment {
    _id: string,
    photo_id: string,
    content: string,
    created_by: {
        user_id: string,
        name: string,
        email: string
    }
    createdAt: Date
}

export interface User {
    name: string,
    email: string,
    password: string
}