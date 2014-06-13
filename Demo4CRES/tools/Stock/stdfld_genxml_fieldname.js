/************************************************************
 *** JSfile   : stdfld_genxml_common.js
 *** Author   : zhuyf
 *** Date     : 2013-5-6
 *** Notes    : 该用户脚本用于生成 标准字段XML文件（普通字段）
 ************************************************************/

	/**用户变量定义区，允许用户自行修改*/
	var fileOutputLocation = sys.getConfig("com.hundsun.ares.studio.preference.fileoutputlocation");  //输出目录，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var userName = sys.get("user.name");//当前注册文件中的用户名，默认选项值，可通过context.get方法获取用户选项值进行替换。
	var notes =" 标准字段XML文件";//说明，默认选项值，可通过context.get方法获取用户选项值进行替换。

	/**
	 * 入口函数一般为外部调用
	 * 
	 * @param context
	 */
	function main(/*Map<Object, Object> */ context) {
		
		var stdfieldInfo = project.getMetadataInfoByType("stdfield");
		var stdItems = stdfieldInfo.getItems();
		
		if(context.get("genMode") ==  "general"){//获取指定生成方式，一般模式
			var xmlFileName = "fieldname.xml";	
			var filePath = fileOutputLocation + "/" + xmlFileName;	
			var xmlBuffer = stringutil.getStringBuffer();
			xmlBuffer.append("<?xml version=\"1.0\" encoding=\"GBK\" ?>\r\n")
			xmlBuffer.append("<!-- Xmlfile : " + xmlFileName + "\r\n");
			xmlBuffer.append("     Author  : " + userName + "\r\n");
			xmlBuffer.append("     Date    : " + calendar.format(calendar.now(),"yyyy-MM-dd") + "\r\n");
			xmlBuffer.append("     Notes   : " + notes+ "(普通字段)\r\n" );
			xmlBuffer.append("\r\n");
			xmlBuffer.append(stdfieldInfo.getModifyHistory("     "));//获取用户常量修改记录，返回全部修改记录的文本
			xmlBuffer.append("--> \r\n");
			xmlBuffer.append("<FieldItems>\r\n");
			
			for(var i in stdItems){
				var stdItem = stdItems[i];
				var stdName = stdItem.getName();
				var stdCName = stdItem.getChineseName();
				var stdDict = stdItem.getDictInfo();
				if (stringutil.isNotBlank(stdName)) {
					xmlBuffer.append("  <FieldItem english_name=\'" + stdName + "\' entry_name=\'" +
							stdCName +"\' dict_entry=\'" + 
							(stdDict == null ? 0 : stdDict.getName()) + "\' />");
					xmlBuffer.append("\r\n");
				}
			}
			xmlBuffer.append("</FieldItems>");
			file.write(filePath, xmlBuffer,"GBK");
		}else {
			var xmlFileName = "floatfield.xml";	
			var file_path = fileOutputLocation + "/" + xmlFileName;	
			var xmlBuffer = stringutil.getStringBuffer();
			xmlBuffer.append("<?xml version=\"1.0\" encoding=\"GBK\" ?>\r\n")
			xmlBuffer.append("<!-- Xmlfile : " + xmlFileName + "\r\n");
			xmlBuffer.append("     Author  : " + userName + "\r\n");
			xmlBuffer.append("     Date    : " + calendar.format(calendar.now(),"yyyy-MM-dd") + "\r\n");
			xmlBuffer.append("     Notes   : " + notes+ "(浮点字段)\r\n" );
			xmlBuffer.append("\r\n");
			xmlBuffer.append(stdfieldInfo.getModifyHistory("     "));//获取用户常量修改记录，返回全部修改记录的文本
			xmlBuffer.append("--> \r\n");
			xmlBuffer.append("<FieldItems>\r\n");
			
			for(var i in stdItems){
				var stdItem = stdItems[i];
				var stdName = stdItem.getName();
				var stdCName = stdItem.getChineseName();
				// 获取标准数据类型，只取浮点型字段，获取长度精度
				var realType = stdItem.getRealType("c");
				var typeLen = stdItem.getLength();
				var typePre = stdItem.getPrecision();
				if (stringutil.isNotBlank(stdName) && stringutil.startsWith(realType,"double")) {
					xmlBuffer.append("  <FieldItem english_name=\'" + stdName + "\' field_type=\'double\' " +
							"field_len=\'" + typeLen + "\' filed_scale=\'" +
							typePre + "\' />");
					xmlBuffer.append("\r\n");
				}
			}
			xmlBuffer.append("</FieldItems>");
			file.write(file_path, xmlBuffer,"GBK");
		}
		file_path = file.getAbsolutePath();
		output.dialog("成功生成标准字段文件，生成路径为：" + file_path);//信息输出，弹出窗口提示信息。工具实现封装细节，用户无需关心调用模式的差异。只有在右键执行、按钮点击时才会弹出信息提示窗口。
		output.info("成功生成标准字段文件，生成路径为" + file_path);//信息输出，控制台输出信息。
	}