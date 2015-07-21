using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Helper;
using LitJson;
using System.Collections;
using System.Data;
using System.Text;
using System.Data.SqlClient;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;

namespace Ische.Api.Repair
{
    /// <summary>
    /// 的摘要说明
    /// </summary>
    public class chen : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            string no = context.Request["no"];
            switch (no)
            {
            case "1":
                    UploadOrderPic2(context);//上传图片
                    break;
            }
        }
        //上传图片
        protected void UploadOrderPic(HttpContext context)
        {
            //var _file = context.Request.Files[0];
            ReturnJsonResult result = new ReturnJsonResult();
            try
            {
                string base64 = context.Request["base64Data"].ToString();
                if (string.IsNullOrEmpty(base64))
                {
                    throw new CustomerException("参数错误");
                }
                byte[] arr = Convert.FromBase64String(base64);
                MemoryStream ms = new MemoryStream(arr);
                Bitmap bitmap = new Bitmap(ms);
                
                string newFileName = DateTime.Now.ToString("yyyyMMddHHmmssffff") + ".jpg";
                string newThumbnailFileName = "thumb_" + newFileName;//随机生成缩略图文件名
                string upLoadPath = "/upfiles/orderpic/" + DateTime.Now.ToString("yyyyMM") + "/"; //上传目录相对路径
                string fullUpLoadPath = HttpContext.Current.Server.MapPath(upLoadPath); //上传目录的物理路径
                string newFilePath = upLoadPath + newFileName; //上传后的路径
                string newThumbnailPath = upLoadPath + newThumbnailFileName; //上传后的缩略图路径

                //检查上传的物理路径是否存在，不存在则创建
                if (!Directory.Exists(fullUpLoadPath))
                {
                    Directory.CreateDirectory(fullUpLoadPath);
                }
                //以jpg格式保存缩略图
                bitmap.Save(fullUpLoadPath + newFileName, System.Drawing.Imaging.ImageFormat.Jpeg);
                bitmap.Dispose();
                result.code = 1;
                result.msg = "success";
                result.datas = result.SingleToHash(newFilePath);
            }
            catch (CustomerException ex)
            {
                result.msg = ex.Message;
            }
            catch (System.Exception ex)
            {
                result.msg = "网络繁忙，请稍后再试！";
                LogHelper.WriteLog(this.GetType(), ex);
            }
            string response = JsonMapper.ToJson(result);
            if (!string.IsNullOrEmpty(context.Request["callback"]))
            {
                string callbackFn = context.Request["callback"];
                response = callbackFn + "(" + response + ");";
            }
            context.Response.Write(response);
        }
    }
  }
