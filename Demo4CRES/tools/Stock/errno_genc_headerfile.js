/************************************************************
 *** JSfile   : cnst_generate_c.js
 *** Author   : zhuyf
 *** Date     : 2013-06-03
 *** Notes    : 系统错误代码脚本
 ************************************************************/

	/**用户变量定义区，允许用户自行修改*/

	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes ="系统错误代码脚本";//说明，默认选项值，可通过context.get方法获取用户选项值进行替换。

	/**
	 * 入口函数一般为外部调用
	 * 
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		var errornoInfoBuffer = stringutil.getStringBuffer();
		var cFileName = "hserror.h"; //文件名
		var file_path = fileOutputLocation + "\\" + cFileName;
		errornoInfoBuffer.append(stringutil.getCHeadFileHeader(cFileName,userName, calendar.format(calendar.now(),"yyyy-MM-dd"),notes));
		var errornoInfo = project.getMetadataInfoByType("errorno");
		errornoInfoBuffer.append(errornoInfo.getModifyHistory("// "));//获取用户常量修改记录，返回全部修改记录的文本
		errornoInfoBuffer.append("#ifndef _HSERROR_H\r\n");
		errornoInfoBuffer.append("#define _HSERROR_H\r\n");
		var categories = errornoInfo.getCategories();
		if(categories.length > 0){
			genCateText(categories, errornoInfoBuffer);
			errornoInfoBuffer.append("#endif /* _HSERROR_H */\r\n");
			file.write(file_path, errornoInfoBuffer ,charset); 
			output.dialog("成功生成错误代码，生成路径为：" + file_path);//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
			output.info("成功生成错误代码，生成路径为" + file_path);//信息输出，控制台输出信息。
		}else{
			output. dialog("无错误号，无法生成错误代码文件！");//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
			output.info("无错误号，无法生成错误代码文件！");//信息输出，控制台输出信息。
		}
	}
	
	function genCateText(categories,errornoInfoBuffer){
		for(var k in categories){
			errornoInfoBuffer.append("/*======================== " + categories[k].getName()+ "===========================================================================*/\r\n");
			var errornoItems = categories[k].getItems();
			if(errornoItems.length > 0){
				for ( var i in errornoItems) {
					var errornoItem = errornoItems[i];
					var name = errornoItem.getName();// 常量定义
					var errorNo = errornoItem.getErrorNo();// 错误编号
					var errornoMsg = errornoItem.getErrorInfo();//错误提示
					if (stringutil.isNotBlank(name)) {
						errornoInfoBuffer.append("#define   ");
						errornoInfoBuffer.append(stringutil.fixLength(name,50,' '));  //用fixLength函数补齐空格对齐
						errornoInfoBuffer.append(stringutil.fixLength(errorNo,20,' '));  //用fixLength函数补齐空格对齐
						errornoInfoBuffer.append("//");
						errornoInfoBuffer.append(errornoMsg);
						errornoInfoBuffer.append("\r\n");
					}
				}
			}
			var cates = categories[k].getCategories();
			if (cates.length > 0) {
				genCateText(cates,errornoInfoBuffer);
			}
		}
	}
	