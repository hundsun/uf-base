/************************************************************
   *** JSfile   : datatype_gensql_oracle.js
   *** Author   : zhuyf
   *** Date     : 2012-11-28
   *** Notes    : 业务类型生成oracle数据库sql文件，生成内容是oracle复杂类型
  ************************************************************/
  
/***********************************************************************************************************************************************
   修订时间   修订版本    修改单    修改人    申请人      修改内容      修改原因          备注 

************************************************************************************************************************************************/
	
	/**用户变量定义区，允许用户自行修改*/
	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset")==""?"GB2312":sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
	var sqlFileName = "ORDataType.sql";//生成的SQL文件名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes ="业务数据定义脚本";//说明信息
	
	/**
	 * 生成数据类型SQL主函数(入口函数，此调用一般为外部调用)
	 * @param context
	 */
	function main(context) {
		var info = project.getMetadataInfoByType("datatype");//获取业务数据类型列表
		var dataTypeList = info.getItems();
		if (dataTypeList.length > 0) {
			var sqlBuffer = stringutil.getStringBuffer();
			sqlBuffer.append(stringutil.getSQLFileHeader(sqlFileName,userName,calendar.format(calendar.now(),"yyyy-MM-dd"),notes));
			sqlBuffer.append(info.getModifyHistory("-- "));//获取数据类型修改记录，返回全部修改记录的文本
			sqlBuffer.append("--\t" + "创建自定义数据类型包\r\n");
			sqlBuffer.append("CREATE OR REPLACE PACKAGE Hstype IS \r\n");
			//遍历业务数据类型条目
			for ( var i in dataTypeList) {
				var dataType = dataTypeList[i];
				var name = dataType.getName();// 名称
				var chineseName = dataType.getChineseName();//中文名
				var realType = dataType.getRealType("oracle");// 数据类型
				sqlBuffer.append("\t" + name + "\t" + realType + ";--" + chineseName + "\r\n");
			}
			sqlBuffer.append("\t" + "TYPE t_cursor IS REF CURSOR;-- 游标定义  "+"\r\n");//增加游标类型定义
			sqlBuffer.append("end Hstype;\r\n");
			sqlBuffer.append("/\r\n");
			var file_path = fileOutputLocation + "\\" + sqlFileName;
			file.write(file_path,sqlBuffer,charset);//生成文件
			file_path = file.getAbsolutePath();
		  	output.dialog("成功生成业务数据定义脚本，生成路径为：" + file_path);
			output.info("成功生成业务数据定义脚本，生成路径为：" + file_path);
	  }else{
	  	output.dialog("数据类型为空，无法生成SQL！");
		output.info("数据类型为空，无法生成SQL！");
	  }
	}