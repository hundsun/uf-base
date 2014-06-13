/************************************************************
 *** JSfile   : cnst_genc_headerfile.js
 *** Author   : zhuyf
 *** Date     : 2012-12-05
 *** Notes    : 该用户脚本用于生成用户常量相关C头文件
 ************************************************************/

	/**用户变量定义区，允许用户自行修改*/

	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var charset = sys.getConfig("com.hundsun.ares.studio.preference.charset");  //默认选项值:编码方式。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes ="常量C头文件";//说明，默认选项值，可通过context.get方法获取用户选项值进行替换。

	/**
	 * 入口函数一般为外部调用
	 * 
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		var cnstBuffer = stringutil.getStringBuffer();
		var cFileName = "hsconst.h"; //文件名
		var file_path = fileOutputLocation + "\\" + cFileName;
		cnstBuffer.append(stringutil.getCHeadFileHeader(cFileName,userName, calendar.format(calendar.now(),"yyyy-MM-dd"),notes));
		var cnstInfo = project.getMetadataInfoByType("constant");
		cnstBuffer.append(cnstInfo.getModifyHistory("// "));//获取用户常量修改记录，返回全部修改记录的文本
		cnstBuffer.append("#ifndef _HSCONST_H\r\n");
		cnstBuffer.append("#define _HSCONST_H\r\n");
		var cnstItems = cnstInfo.getItems();
		if(cnstItems.length > 0){
			for ( var i in cnstItems) {
				var constItem = cnstItems[i];
				var constDesc = constItem.getOriginalInfo().getDescription();// 备注信息
				var constName = constItem.getOriginalInfo().getName();// 常量ID
				//启用标志，通过扩展获取，如果启用标志为“1”则生成
				var enableFlag = constItem.getExtendsValue("user" + "_" + "enable_flag");
				if(enableFlag != "1") {
					continue;
				}
				if (stringutil.isNotBlank(constName)) {
					var constValue = constItem.getOriginalInfo().getValue();// 常量值
					if (stringutil.isNotBlank(constValue)) {
						cnstBuffer.append("#define   ");
						cnstBuffer.append(stringutil.fixLength(constName,50,' '));  //用fixLength函数补齐空格对齐
						cnstBuffer.append(stringutil.fixLength(constValue,20,' '));  //用fixLength函数补齐空格对齐
						cnstBuffer.append("//");
						cnstBuffer.append(constDesc);
						cnstBuffer.append("\r\n");
					}
				}
			}
			cnstBuffer.append("#endif\r\n");
			file.write(file_path, cnstBuffer ,charset); 
			file_path = file.getAbsolutePath();
			output.dialog("成功生成常量C头文件，生成路径为：" + file_path);//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
			output.info("成功生成常量C头文件，生成路径为" + file_path);//信息输出，控制台输出信息。
		}else{
			output. dialog("无常量，无法生成常量C头文件！");//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
			output.info("无常量，无法生成常量C头文件！");//信息输出，控制台输出信息。
		}
	}