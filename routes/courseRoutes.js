import { Router } from 'express'
import { addLectureToCourseById, createCourse, deleteCourse, getAllCourses, getLecturesByCourseId, updateCourse } from '../controllers/courseControllers.js'
import { isLoggedIn, authorizedRoles, authorizedSubscriber } from '../middlewares/authMiddleware.js'
import upload from '../middlewares/multerMiddleware.js'

const router = Router()

router
    .route('/')
    .get(getAllCourses)
    .post( 
        isLoggedIn,
        authorizedRoles('ADMIN'),
        upload.single('thumbnail'),
        createCourse
    )

router
    .route('/:courseId')
    .get( 
        isLoggedIn,
        authorizedSubscriber,
        getLecturesByCourseId
    )
    .put( 
        isLoggedIn,
        authorizedRoles('ADMIN'), 
        updateCourse
    )
    .delete( 
        isLoggedIn,
        authorizedRoles('ADMIN'),
        deleteCourse
    )
    .post(
        isLoggedIn,
        authorizedRoles('ADMIN'),
        upload.single('lecture'),
        addLectureToCourseById
    )


export default router;