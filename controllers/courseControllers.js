import Course from '../models/courseModel.js'
import appError from '../utils/appError.js'
import cloudinary from 'cloudinary'
import fs from 'fs/promises'

const getAllCourses = async (req, res, next) => {
    try{
        const courses = await Course.find({}).select('-lectures')

        res.status(200).json({
            success: true,
            message: 'All Courses!',
            courses,
        })
    } catch(error){
        return next(new appError(error.message, 500))
    }
}

const getLecturesByCourseId = async (req, res, next) => {
    try{
        const { courseId } = req.params
        const course = await Course.findById(courseId)

        if(!course){
            return next(new appError('Invalid course ID', 400))
        }

        res.status(200).json({
            success: true,
            message: 'Course lectures fetched successfully!',
            lectures: course.lectures,
        })
    } catch(errpr){
        return next(new appError(error.message, 500))
    }
}

const createCourse = async (req, res, next) => {
    try{
        const { title, description, category, createdBy } = req.body

        if( !title || !description || !category || !createdBy ){
            return next(new appError('All fields are required!'), 400)
        }

        const course = await Course.create({
            title,
            description,
            category,
            createdBy,
            thumbnail: {
                public_id: 'DUMMY',
                secure_url: 'DUMMY',
            },
        })

        if(req.file){
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
            })

            if(result){
                course.thumbnail.public_id = result.public_id
                course.thumbnail.secure_url = result.secure_url

                fs.rm(`uploads/${req.file.filename}`)
            }
        }

        await course.save()

        res.status(200).json({
            success: true,
            message: 'Course created successfully!',
            course
        })

    } catch(error){
        return next(new appError(error.message), 500)
    }
}

const updateCourse = async (req, res, next) => {
    try{
        const { courseId } = req.params

        const course = await Course.findByIdAndUpdate(
            courseId,
            {
                $set: req.body
            },
            {
                runValidators: true
            }
        )

        if(!course){
            return next(new appError('Course does not exist', 400))
        }

        res.status(200).json({
            success: true,
            message: 'Course updated successfully!',
            course
        })
    } catch(error){
        return next(new appError(error.message), 500)
    }
}

const deleteCourse = async (req, res, next) => {
    try{
        const { courseId } = req.params

        const course = await Course.findById(courseId)
        if(!course){
            return next(new appError('Course does not exist!', 400))
        }

        await Course.findByIdAndDelete(courseId)

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully!'
        })

    } catch(error){
        return next(new appError(error.message), 500)
    }
}

const addLectureToCourseById = async (req, res, next) => {
    try{
        const { title, description } = req.body
        const { courseId } = req.params

        if(!title || !description){
            return next(new appError('All fields are required', 400))
        }

        const course = await Course.findById(courseId)
        if(!course){
            return next(new appError('Course with given ID does not exist!', 400))
        }

        const lectureData = {
            title,
            description,
            lecture: {
                public_id: 'DUMMY',
                secure_url: 'DUMMY',
            }
        }

        if(req.file){
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
            })

            if(result){
                lectureData.lecture.public_id = result.public_id
                lectureData.lecture.secure_url = result.secure_url
            }

            fs.rm(`uploades/${req.file.filename}`)
        }

        course.lectures.push(lectureData)
        course.numberOfLectures = course.lectures.length

        await course.save()

        res.status(200).json({
            success: true,
            message: 'Lecture added successfully!',
            course
        })

    } catch(error){
        return next(new appError(error.message, 500))
    }
}

// DELETE LECTURE CONTROLLER baki hai

export{
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    deleteCourse,
    addLectureToCourseById,
} 