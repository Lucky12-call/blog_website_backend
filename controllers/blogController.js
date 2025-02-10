import cloudinary from "cloudinary";
import { catchAsyncErrors } from "../middleware/catchAsyncError.js";
import { Blog } from "../models/blogSchema.js";

export const blogPost = catchAsyncErrors(async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Main blog image is Mandatory..." });
  }

  const { mainImage, paraOneImage, paraTwoImage } = req.files;
  if (!mainImage) {
    return res
      .status(400)
      .json({ success: false, message: "Main blog image is Mandatory" });
  }

  const allowedFormats = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
  if (
    !allowedFormats.includes(mainImage.mimetype) ||
    (paraOneImage && !allowedFormats.includes(paraOneImage.mimetype)) ||
    (paraTwoImage && !allowedFormats.includes(paraTwoImage.mimetype))
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid file type only png, jpeg and webp formate allowed!",
    });
  }

  const {
    title,
    intro,
    paraOneDescription,
    paraOneTitle,
    paraTwoDescription,
    paraTwoTitle,
    category,
    published,
  } = req.body;

  const createdBy = req.user._id;
  const authorName = req.user.name;
  const authorAvatar = req.user.avatar.url;

  if (!title || !category || !intro) {
    return res.status(400).json({
      success: false,
      message: "Title, Intro and Category are required fields!",
    });
  }

  const uploadPromises = [
    await cloudinary.uploader.upload(mainImage.tempFilePath),
    paraOneImage
      ? await cloudinary.uploader.upload(paraOneImage.tempFilePath)
      : Promise.resolve(null),
    paraTwoImage
      ? await cloudinary.uploader.upload(paraTwoImage.tempFilePath)
      : Promise.resolve(null),
  ];

  const [mainImageRes, paraOneImageRes, paraTwoImageRes] = await Promise.all(
    uploadPromises
  );

  if (
    !mainImageRes ||
    mainImageRes.error ||
    (paraOneImage && (!paraOneImage || paraOneImageRes.error)) ||
    (paraTwoImage && (!paraTwoImage || paraTwoImageRes.error))
  ) {
    return res.status(400).json({
      success: false,
      message: "Error occurred white uploading one or more images!",
    });
  }

  const blogData = {
    title,
    intro,
    paraOneDescription,
    paraOneTitle,
    paraTwoDescription,
    paraTwoTitle,
    category,
    createdBy,
    authorName,
    authorAvatar,
    mainImage: {
      public_id: mainImageRes.public_id,
      url: mainImageRes.secure_url,
    },
    published,
  };

  if (paraOneImage) {
    blogData.paraOneImage = {
      public_id: paraOneImageRes.public_id,
      url: paraOneImageRes.secure_url,
    };
  }

  if (paraTwoImage) {
    blogData.paraTwoImage = {
      public_id: paraTwoImageRes.public_id,
      url: paraTwoImageRes.secure_url,
    };
  }

  const blog = await Blog.create(blogData);
  res.status(200).json({
    success: true,
    message: "Blog Uploaded!",
    blog,
  });
});

//delete blogs
export const deleteBlog = catchAsyncErrors(async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findById(id);

  if (!blog) {
    return res.status(400).json({
      success: false,
      message: "Blog not found!",
    });
  }

  await blog.deleteOne();
  res.status(200).json({
    success: true,
    message: "blog deleted!",
  });
});

//get all blogs
export const getAllBlog = catchAsyncErrors(async (_, res) => {
  const allBlogs = await Blog.find({ published: true });

  res.status(200).json({
    success: true,
    allBlogs,
  });
});

//get a particular blog
export const getSingleBlog = catchAsyncErrors(async (req, res) => {
  const { id } = req.params;
  const singleBlog = await Blog.findById(id);

  if (!singleBlog) {
    return res.status(400).json({
      success: false,
      message: "Blog not found!",
    });
  }

  res.status(200).json({
    success: true,
    singleBlog,
  });
});

//get particular user blogs
export const getMyBlogs = catchAsyncErrors(async (req, res) => {
  const createdBy = req.user._id;
  const blogs = await Blog.find({ createdBy });

  res.status(200).json({
    success: true,
    blogs,
  });
});

//update blog
export const updateBlog = catchAsyncErrors(async (req, res) => {
  const { id } = req.params;
  let blog = await Blog.findById(id);

  if (!blog) {
    return res.status(400).json({
      success: false,
      message: "Blog not found!",
    });
  }

  const newBlogData = {
    title: req.body.title,
    intro: req.body.intro,
    category: req.body.category,
    paraOneTitle: req.body.paraOneTitle,
    paraOneDescription: req.body.paraOneDescription,
    paraTwoTitle: req.body.paraTwoTitle,
    paraTwoDescription: req.body.paraTwoDescription,
    published: req.body.published,
  };

  if (req.files) {
    const { mainImage, paraOneImage, paraTwoImage } = req.files;
    const allowedFormats = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/webp",
    ];

    if (
      !allowedFormats.includes(mainImage.mimetype) ||
      (paraOneImage && !allowedFormats.includes(paraOneImage.mimetype)) ||
      (paraTwoImage && !allowedFormats.includes(paraTwoImage.mimetype))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type only png, jpeg and webp formate allowed!",
      });
    }
    if (req.files && mainImage) {
      const blogMainImageId = blog.mainImage.public_id;
      await cloudinary.uploader.destroy(blogMainImageId);
      const newBlogMainImage = await cloudinary.uploader.upload(
        mainImage.tempFilePath
      );
      newBlogData.mainImage = {
        public_id: newBlogMainImage.public_id,
        url: newBlogMainImage.secure_url,
      };
    }

    //para one
    if (req.files && paraOneImage) {
      if (blog.paraOneImage) {
        const blogParaOneImageId = blog.paraOneImage.public_id;
        await cloudinary.uploader.destroy(blogParaOneImageId);
      }

      const newBlogParaOneImage = await cloudinary.uploader.upload(
        paraOneImage.tempFilePath
      );
      newBlogData.paraOneImage = {
        public_id: newBlogParaOneImage.public_id,
        url: newBlogParaOneImage.secure_url,
      };
    }

    //para two
    if (req.files && paraTwoImage) {
      if (blog.paraTwoImage) {
        const blogParaTwoImageId = blog.paraTwoImage.public_id;
        await cloudinary.uploader.destroy(blogParaTwoImageId);
      }

      const newBlogParaTwoImage = await cloudinary.uploader.upload(
        paraOneImage.tempFilePath
      );
      newBlogData.paraTwoImage = {
        public_id: newBlogParaTwoImage.public_id,
        url: newBlogParaTwoImage.secure_url,
      };
    }
  }

  blog = await Blog.findByIdAndUpdate(id, newBlogData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "Blog updated!",
    blog,
  });
});
